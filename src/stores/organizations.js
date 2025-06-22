import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { generateSlug, generateRandomId } from '@/utils/id.js'


export const useOrganizationsStore = defineStore('organizations', () => {
    const loading = ref(false)
    const error = ref(null)
    const CACHE_TTL = 5 * 60 * 1000

    // organization and orchards cached together!
    const orgCache = ref({ data: null, fetchedAt: 0 })
    const organization = computed(() => orgCache.value.data)
    const orchards = ref([])

    // with organization i get orchards
    async function fetchOrganization(orgId) {
        const now = Date.now()

        if (orgCache.value.data?.id === orgId && (now - orgCache.value.fetchedAt) < CACHE_TTL) {
            console.log('[♻️] cached Organization and Orchards')
            return
        }

        console.log('[📨] fetchOrganization running')
        loading.value = true
        error.value = null

        try {
            if (!orgId) {
                throw new Error('Organization ID missing')
            }

            // Load organization Document
            const orgDocRef = doc(db, 'organizations', orgId)
            const orgSnapshot = await getDoc(orgDocRef)

            if (!orgSnapshot.exists()) {
                throw new Error(`Organization with ID "${orgId}" does not exist`)
            }

            const loadedOrg = { id: orgSnapshot.id, ...orgSnapshot.data() }
            orgCache.value = { data: loadedOrg, fetchedAt: now }

            // Load orchards in Organization
            const orchardsCol = collection(db, 'organizations', orgId, 'orchards')
            const orchardsSnap = await getDocs(orchardsCol)

            orchards.value = orchardsSnap.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }))

        } catch (err) {
            console.error('Error when loading:', err)
            error.value = err.message || 'Failed to load organization.'
        } finally {
            loading.value = false
        }
    }

    const treesForOrchardCache = reactive(new Map())

    function getTreesForOrchard(id) {
        return treesForOrchardCache.get(id)?.data || []
    }

    async function fetchTrees(orgId, orchardId) {
        const now = Date.now()
        const orchard = treesForOrchardCache.get(orchardId)

        if (orchard && (now - orchard.fetchedAt) < CACHE_TTL) {
            console.log('[♻️] cached Orchard trees')
            return
        }

        console.log('[📨] fetchTrees running')

        try {
            if (!orgId || !orchardId) {
                throw new Error('Organization ID or Orchard ID missing')
            }
            const treesSnap = await getDocs(
                collection(db, 'organizations', orgId, 'orchards', orchardId, 'trees')
            );

            treesForOrchardCache.set(orchardId, {
                data: treesSnap.docs.map(doc => {
                    const { name, slug, wateredUntil = null, owner = null, variety = null, createdAt = null } = doc.data()
                    return {
                        id: doc.id,
                        name,
                        slug,
                        wateredUntil,
                        owner,
                        variety,
                        createdAt
                    }
                }),
                fetchedAt: now
            })

        } catch (error) {
            throw error
        }
    }


    const treesDetailCache = reactive(new Map())

    function getTreeData(id) {
        return computed(() => treesDetailCache.get(id)?.data || null)
    }
    function getTreeMeta(id) {
        return treesDetailCache.get(id)
    }

    async function fetchTree(orgId, orchardId, treeId) {
        const now = Date.now()

        const cached = getTreeMeta(treeId)
        if (cached && (now - cached.fetchedAt) < CACHE_TTL) {
            console.log('[♻️] cached Tree')
            return
        }

        console.log('[📨] fetchTree running')
        try {
            if (!orgId || !orchardId || !treeId) {
                throw new Error('Organization ID or Orchard ID or Tree ID missing')
            }

            const snap = await getDoc(
                doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
            )

            if (!snap.exists()) throw new Error('Tree not found')

            treesDetailCache.set(snap.id, {
                data: { ...snap.data() },
                fetchedAt: now
            })
        } catch (error) {
            throw error
        }
    }

    async function addTree(orgId, orchardId, data) {
        const treeSlug = generateSlug(data.treeName)
        const treeId = generateRandomId()

        const newTree = {
            id: treeId,
            slug: treeSlug,
            name: data.treeName,
            type: 'tree',
            variety: data.treeVariety || null,
            owner: data.treeOwner || null,
            wateredUntil: null,
            createdAt: new Date(), //Local time for optimistic update
            createdBy: 'user'
        }

        // Optimistic update
        const prev = treesForOrchardCache.get(orchardId)
        const oldList = prev?.data || []
        treesForOrchardCache.set(orchardId, {
            data: [...oldList, newTree]
        })

        try {
            // Send to server
            const treeRef = doc(
                db,
                'organizations', orgId,
                'orchards', orchardId,
                'trees', treeId
            )
            await setDoc(treeRef, {
                ...newTree,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            // Rollback on error: restore the original state
            treesForOrchardCache.set(orchardId, { data: oldList })
            console.error('Pridanie stromu zlyhalo:', error);
            throw error
        }
    }

    return {
        loading,
        error,
        organization,
        orchards,

        fetchOrganization,

        fetchTrees,
        getTreesForOrchard,

        fetchTree,
        getTreeData,
        getTreeMeta,
        addTree,

        // ONLY FOR TESTING
        orgCache,
        treesForOrchardCache,
        treesDetailCache
    }


})
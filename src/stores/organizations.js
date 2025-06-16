import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'


export const useOrganizationsStore = defineStore('organizations', () => {
    const loading = ref(false)
    const error = ref(null)
    const CACHE_TTL = 5 * 60 * 1000

    // organization and orchards cached together!
    const orgCache = ref({ data: null, fetchedAt: 0 })
    const organization = computed(() => orgCache.value.data)
    const orchards = ref([])


    const treesByOrchardCache = ref({})
    const treesByOrchard = computed(() => {
        const result = {}
        for (const id in treesByOrchardCache.value) {
            result[id] = treesByOrchardCache.value[id].data
        }
        return result
    })

    // NEED CACHE!
    // Z tohoto spravit pole pre cachovanie!
    const treeDetail = ref(null)


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

    async function fetchTrees(orgId, orchardId) {
        const now = Date.now()

        if (treesByOrchardCache.value[orchardId] && (now - treesByOrchardCache.value[orchardId]?.fetchedAt) < CACHE_TTL) {
            console.log('[♻️] cached Orchard trees')
            return
        }

        console.log('[📨] fetchTrees running')
        loading.value = true
        error.value = null

        try {
            if (!orgId || !orchardId) {
                throw new Error('Organization ID or Orchard ID missing')
            }
            const treesSnap = await getDocs(
                collection(db, 'organizations', orgId, 'orchards', orchardId, 'trees')
            );
            treesByOrchardCache.value[orchardId] = {
                data: treesSnap.docs.map(doc => {
                    const { name, slug, wateredUntil } = doc.data()
                    return {
                        id: doc.id,
                        name,
                        slug,
                        wateredUntil
                    }
                }),
                fetchedAt: now
            }
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function fetchTree(orgId, orchardId, treeId) {
        console.log('[📨] fetchTree running')
        loading.value = true
        error.value = null

        try {
            if (!orgId || !orchardId || !treeId) {
                throw new Error('Organization ID or Orchard ID or Tree ID missing')
            }

            const snap = await getDoc(
                doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
            )

            if (!snap.exists()) throw new Error('Tree not found')
            treeDetail.value = { id: snap.id, ...snap.data() }
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }

    }

    return {
        loading,
        error,
        organization,
        orchards,
        treesByOrchard,
        treeDetail,
        fetchOrganization,
        fetchTrees,
        fetchTree,

        // ONLY FOR TESTING
        orgCache,
        treesByOrchardCache
    }


})
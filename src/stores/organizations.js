import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase.js'
import { generateSlug, generateRandomId } from '@/utils/id.js'
import { useAuthStore } from '@/stores/auth.js'


export const useOrganizationsStore = defineStore('organizations', () => {
    //HARDCODED
    const _orchardId = 'sad'
    const _orgId = 'Drahovce'

    const auth = useAuthStore()
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

    function updateTreeInOrchard(orchardId, treeId, updatedFields) {
        const orchardCache = treesForOrchardCache.get(orchardId)
        if (!orchardCache) {
            return
        }

        const newData = orchardCache.data.map(tree =>
            tree.id === treeId
                ? { ...tree, ...updatedFields }
                : tree
        )

        treesForOrchardCache.set(orchardId, {
            data: newData,
            fetchedAt: orchardCache.fetchedAt
        })
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

            if (treesSnap.empty) {
                throw new Error(`Sad "${orchardId}" v organizácii "${orgId}" neexistuje`)
            }

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

    async function waterTree(orgId, orchardId, treeId, wateredUntil) {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;

        let baseDate = now;
        if (wateredUntil?.toDate) {
            const wDate = wateredUntil.toDate();
            if (wDate > now) baseDate = wDate;
        }

        const nextDate = new Date(baseDate.getTime() + 14 * msPerDay);
        const nextTs = Timestamp.fromDate(nextDate);
        try {
            await updateTreeData(orgId, orchardId, treeId, {
                wateredUntil: nextTs
            });
        } catch (error) {
            throw error
        }
    }

    async function updateTreeData(orgId, orchardId, treeId, updateFields) {
        // Find tree in tree detail cache
        const metaDetail = treesDetailCache.get(treeId)

        if (!metaDetail) {
            throw new Error(`Strom ${treeId} nie je v cache`);
        }

        const prevData = { ...metaDetail.data }
        const prevLogs = Array.isArray(prevData.logs) ? prevData.logs : [];

        const newLogEntry = {
            type: 'watering',
            by: auth.fullName || 'user',
            prevWateredUntil: prevData.wateredUntil,
            newWateredUntil: updateFields.wateredUntil,
            loggedAt: Timestamp.now()
        }

        const newData = {
            ...metaDetail.data,
            ...updateFields,
            logs: [...prevLogs, newLogEntry]
        }

        treesDetailCache.set(treeId, {
            data: newData
        })

        const treeRef = doc(
            db,
            "organizations", orgId,
            "orchards", orchardId,
            "trees", treeId
        );

        try {
            await updateDoc(treeRef, {
                ...updateFields,
                logs: arrayUnion(newLogEntry)
            })

            // If the data is successfully saved, I will also update it in the local cache for orchardCache
            updateTreeInOrchard(orchardId, treeId, {
                ...updateFields,
                logs: [newLogEntry]
            })

        } catch (error) {
            treesDetailCache.set(treeId, {
                data: prevData
            });
            console.error("Optimistic update stromu zlyhalo, rollbackujem:", error);
            throw error;
        }
    }

    return {
        _orchardId,
        _orgId,

        loading,
        error,
        organization,
        orchards,

        fetchTrees,
        getTreesForOrchard,

        fetchTree,
        getTreeData,
        getTreeMeta,
        addTree,
        waterTree,
    }


})
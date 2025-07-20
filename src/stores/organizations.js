import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { collection, addDoc, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, Timestamp, orderBy, limit, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import { generateSlug, generateRandomId } from '@/utils/id.js'
import { useAuthStore } from '@/stores/auth.js'


export const useTreesStore = defineStore('trees', () => {
    //HARDCODED
    const _orchardId = 'sad'
    const _orgId = 'Drahovce'

    const auth = useAuthStore()
    const CACHE_TTL = 5 * 60 * 1000

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

            // Get logs for tree
            const logsRef = collection(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId, 'logs')
            const q = query(logsRef, orderBy('loggedAt', 'desc'), limit(5))
            const logSnap = await getDocs(q)
            const logs = logSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));


            treesDetailCache.set(snap.id, {
                data: { ...snap.data(), logs: logs },
                fetchedAt: now,

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
            await updateTreeData(orgId, orchardId, treeId, 'MANUAL_WATERING', {
                wateredUntil: nextTs
            });
        } catch (error) {
            throw error
        }
    }

    /**
     * Zaloguje udalosť stromu do subkolekcie logs.
     *
     * @param {string} orgId 
     * @param {string} orchardId 
     * @param {string} treeId 
     * @param {'CREATE'|'MANUAL_WATERING'|'AUTOMATIC_WATERING'|'UPDATE'} logType 
     * @param {object} updateFields  – všetky ďalšie polia, ktoré chceš uložiť (prevWateredUntil, newWateredUntil, addedHours, changedFields…)
    */
    async function updateTreeData(orgId, orchardId, treeId, logType, updateFields) {
        const metaDetail = treesDetailCache.get(treeId)
        if (!metaDetail) {
            throw new Error(`Strom ${treeId} nie je v cache`)
        }

        // Uložíme predchádzajúci stav pre rollback
        const prevDetail = { ...metaDetail.data }
        const prevOrchardEntry = treesForOrchardCache
            .get(orchardId)
            ?.data.find(t => t.id === treeId)

        // Pripravíme log entry
        const newLogEntry = {
            type: logType,
            by: auth.fullName || 'user',
            byId: auth.user.uid || '0',
            prevWateredUntil: prevDetail.wateredUntil || null,
            newWateredUntil: updateFields.wateredUntil || null,
            loggedAt: Timestamp.now()
        }

        // --- OPTIMISTIC UPDATE ---
        //  a) detail
        metaDetail.data.wateredUntil = updateFields.wateredUntil
        if (Array.isArray(metaDetail.data.logs)) {
            metaDetail.data.logs.unshift(newLogEntry)
        }
        //  b) summary v orchardsCache (len polia, nie logs)
        if (prevOrchardEntry) {
            Object.assign(prevOrchardEntry, updateFields)
        }

        // Firestore referencie
        const treeRef = doc(
            db,
            'organizations', orgId,
            'orchards', orchardId,
            'trees', treeId
        )
        const logsCol = collection(
            db,
            'organizations', orgId,
            'orchards', orchardId,
            'trees', treeId,
            'logs'
        )

        try {
            // 2) aktualizujeme hlavný stromový dokument (wateredUntil + updatedAt)
            await updateDoc(treeRef, {
                ...updateFields,
                updatedAt: serverTimestamp()
            })

            // 3) pridáme samostatný dokument do subkolekcie logs
            await addDoc(logsCol, newLogEntry)

        } catch (err) {
            // --- ROLLBACK ---
            Object.assign(metaDetail.data, prevDetail)
            if (prevOrchardEntry) {
                prevOrchardEntry.wateredUntil = prevDetail.wateredUntil
            }
            console.error('[updateTreeData] rollback due to', err)
            throw err
        }
    }

    return {
        _orchardId,
        _orgId,

        fetchTrees,
        getTreesForOrchard,

        fetchTree,
        getTreeData,
        getTreeMeta,
        addTree,
        waterTree,
    }


})
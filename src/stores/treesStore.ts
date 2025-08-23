import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { Timestamp } from 'firebase/firestore'
import { generateSlug, generateRandomId } from '@/utils/id'
import { useAuthStore } from '@/stores/authStore'
import { createLogEntry } from '@/types/logType.js'
import type { LogType } from '@/types/logType.js'
import type { Tree, TreeWithLogs } from '@/types/treeType.js'
import {
    addTreeLog,
    addTreeToFirestore,
    fetchTreesFromFirestore,
    fetchTreeWithLogs,
    getNextWateringDate,
    updateTreeInFirestore,
} from '@/api/treeApi'

export const useTreesStore = defineStore('trees', () => {
    // === HARD CODED
    const _orchardId = 'sad'
    const _orgId = 'Drahovce'

    const auth = useAuthStore()
    const CACHE_TTL = 5 * 60 * 1000

    // === CACHE
    const treesForOrchardCache = reactive(new Map<string, { data: Tree[]; fetchedAt: Timestamp }>())
    const treesDetailCache = reactive(
        new Map<string, { data: TreeWithLogs; fetchedAt: Timestamp }>(),
    )

    // === GETTERS
    function getTreesForOrchard(id: string) {
        return treesForOrchardCache.get(id)?.data || []
    }

    function getTreeData(id: string) {
        return computed(() => treesDetailCache.get(id)?.data || null)
    }

    function getTreeMeta(id: string) {
        return treesDetailCache.get(id)
    }

    // === ACTIONS

    async function fetchTrees(orgId: string, orchardId: string) {
        const now = Timestamp.now().toMillis()
        const cache = treesForOrchardCache.get(orchardId)

        if (cache && now - cache.fetchedAt.toMillis() < CACHE_TTL) {
            console.log('[♻️] cached Orchard trees')
            return
        }

        console.log('[📨] fetchTrees running')
        const trees = await fetchTreesFromFirestore(orgId, orchardId)
        treesForOrchardCache.set(orchardId, {
            data: trees,
            fetchedAt: Timestamp.now(),
        })
    }

    async function fetchTree(orgId: string, orchardId: string, treeId: string) {
        const now = Timestamp.now().toMillis()
        const cache = getTreeMeta(treeId)

        if (cache && now - cache.fetchedAt.toMillis() < CACHE_TTL) {
            console.log('[♻️] cached Tree')
            return
        }

        console.log('[📨] fetchTree running')
        const treeWithLogs = await fetchTreeWithLogs(orgId, orchardId, treeId)
        treesDetailCache.set(treeId, {
            data: treeWithLogs,
            fetchedAt: Timestamp.now(),
        })
    }

    async function addTree(
        orgId: string,
        orchardId: string,
        data: { treeName: string; treeVariety: string; treeOwner: string },
    ) {
        const treeSlug = generateSlug(data.treeName)
        const treeId = generateRandomId()

        const newTree: Tree = {
            id: treeId,
            slug: treeSlug,
            name: data.treeName,
            type: 'tree',
            variety: data.treeVariety || null,
            owner: data.treeOwner,
            wateredUntil: null,
            createdBy: auth.fullName || 'user',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        // optimistic update
        const prev = treesForOrchardCache.get(orchardId)
        const oldList = prev?.data || []
        treesForOrchardCache.set(orchardId, {
            data: [...oldList, newTree],
            fetchedAt: Timestamp.now(),
        })

        const logEntry = createLogEntry({
            type: 'CREATE',
            by: auth.fullName,
            byId: auth.user?.uid || '',
        })

        try {
            await addTreeToFirestore(orgId, orchardId, treeId, newTree)
            await addTreeLog(orgId, orchardId, treeId, logEntry)
        } catch (err) {
            //rollback
            treesForOrchardCache.set(orchardId, { data: oldList, fetchedAt: Timestamp.now() })
            throw err
        }
    }

    async function waterTree(
        orgId: string,
        orchardId: string,
        treeId: string,
        currentWateredUntil: Timestamp,
    ) {
        const now = Timestamp.now()
        const base =
            currentWateredUntil && currentWateredUntil.toMillis() > now.toMillis()
                ? currentWateredUntil
                : now
        const nextWatering = getNextWateringDate(base)
        await updateTreeData(orgId, orchardId, treeId, 'MANUAL_WATERING', {
            wateredUntil: nextWatering,
        })
    }

    async function updateTreeData(
        orgId: string,
        orchardId: string,
        treeId: string,
        logType: LogType,
        updateFields: { wateredUntil: Timestamp },
    ) {
        const metaDetail = treesDetailCache.get(treeId)
        if (!metaDetail) {
            throw new Error(`Strom ${treeId} nie je v cache`)
        }

        const prevDetail = { ...metaDetail.data }
        const prevOrchardEntry = treesForOrchardCache
            .get(orchardId)
            ?.data.find((t) => t.id === treeId)

        const logEntry = createLogEntry({
            type: logType,
            by: auth.fullName,
            byId: auth.user?.uid || '',
            prevWateredUntil: prevDetail.wateredUntil || null,
            newWateredUntil: updateFields.wateredUntil,
        })

        // optimistic update
        metaDetail.data.wateredUntil = updateFields.wateredUntil
        metaDetail.data.logs?.unshift(logEntry)

        if (prevOrchardEntry) {
            Object.assign(prevOrchardEntry, updateFields)
        }

        try {
            await updateTreeInFirestore(orgId, orchardId, treeId, updateFields)
            await addTreeLog(orgId, orchardId, treeId, logEntry)
        } catch (err) {
            // rollback
            Object.assign(metaDetail.data, prevDetail)
            if (prevOrchardEntry) {
                prevOrchardEntry.wateredUntil = prevDetail.wateredUntil || null
            }
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

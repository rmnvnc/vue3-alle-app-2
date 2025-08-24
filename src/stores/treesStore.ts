import { ref } from 'vue'
import { defineStore } from 'pinia'
import { generateSlug, generateRandomId } from '@/utils/id'
import { useAuthStore } from '@/stores/authStore'
import { createLogEntry } from '@/types/logType.js'
import type { TreeLogsState } from '@/types/logType.js'
import type { Tree, TreeEntity, TreeIndex } from '@/types/treeType.js'
import {
    apiFetchTree,
    apiFetchTreeLogs,
    apiFetchTrees,
    getNextWateringDate,
    apiUpdateTreeAndLog,
    apiCreateTreeAndLog,
} from '@/api/treeApi'

export const useTreesStore = defineStore('trees', () => {
    const auth = useAuthStore()

    // === HARD CODED
    const _orchardId = 'sad'
    const _orgId = 'Drahovce'
    const CACHE_TTL = 5 * 60 * 1000

    //state
    const entities = ref<Record<string, TreeEntity>>({})
    const indexByOrchard = ref<Record<string, TreeIndex>>({})
    const logsByTreeId = ref<Record<string, TreeLogsState>>({})

    //helpers
    const isStale = (fetchedAt?: number) => !fetchedAt || Date.now() - fetchedAt > CACHE_TTL

    //getters
    const getById = (id: string) => entities.value[id]?.data

    const listByOrchard = (orchardId: string): Tree[] => {
        const idx = indexByOrchard.value[orchardId]
        if (!idx) return []
        return idx.ids.map((id) => entities.value[id]?.data).filter(Boolean) as Tree[]
    }

    const getLogs = (treeId: string) => logsByTreeId.value[treeId]?.items ?? []

    //actions
    async function fetchTrees(orgId: string, orchardId: string, options: { force?: boolean } = {}) {
        const idx = indexByOrchard.value[orchardId]
        const shouldFetch = options.force || !idx || isStale(idx.fetchedAt)

        if (!shouldFetch) return

        const list = await apiFetchTrees(orgId, orchardId)
        const now = Date.now()

        const patch: Record<string, TreeEntity> = {}
        for (const t of list) {
            patch[t.id] = { data: t, hydratation: 'full', fetchedAt: now }
        }

        if (Object.keys(patch).length) {
            entities.value = { ...entities.value, ...patch }
        }

        indexByOrchard.value[orchardId] = {
            ids: list.map((t) => t.id),
            fetchedAt: now,
        }
    }

    async function fetchTreeDetail(
        orgId: string,
        orchardId: string,
        treeId: string,
        options: { force?: boolean } = {},
    ) {
        const ent = entities.value[treeId]
        const needsHydratation = !ent || ent?.hydratation !== 'full'
        const stale = !ent || isStale(ent.fetchedAt)

        if (!options.force && !(needsHydratation || stale)) return

        const full = await apiFetchTree(orgId, orchardId, treeId)

        const now = Date.now()
        entities.value[treeId] = {
            data: full,
            hydratation: 'full',
            fetchedAt: now,
        }
    }

    async function fetchLogsForTree(
        orgId: string,
        orchardId: string,
        treeId: string,
        options: { force?: boolean } = {},
    ) {
        const logsState = logsByTreeId.value[treeId]
        const should = options.force || !logsState || isStale(logsState.fetchedAt)
        if (!should) return

        const logs = await apiFetchTreeLogs(orgId, orchardId, treeId)
        logsByTreeId.value[treeId] = { items: logs, fetchedAt: Date.now() }
    }

    async function waterTreeNow(orgId: string, orchardId: string, treeId: string) {
        const tree = entities.value[treeId]

        if (!tree) return

        // Minimal snapshot as a backup for failed DB update
        const prevWatered = tree.data.wateredUntil
        const prevUpdated = tree.data.updatedAt

        //Optimistic local tree update
        const { Timestamp } = await import('firebase/firestore')
        const now = Timestamp.now()
        const currentWatered =
            tree.data.wateredUntil && tree.data.wateredUntil.toMillis() > now.toMillis()
                ? tree.data.wateredUntil
                : now
        const nextWatering = getNextWateringDate(currentWatered)
        tree.data = { ...tree.data, wateredUntil: nextWatering, updatedAt: now }

        //Optimistic local log update
        const logs = logsByTreeId.value[treeId]?.items ?? []
        const newLog = createLogEntry({
            type: 'MANUAL_WATERING',
            by: auth.fullName,
            byId: auth.user?.uid || '',
            prevWateredUntil: prevWatered,
            newWateredUntil: nextWatering,
        })
        logsByTreeId.value[treeId] = {
            items: [{ ...newLog }, ...logs],
            fetchedAt: Date.now(),
        }

        // DB update
        try {
            await apiUpdateTreeAndLog(
                orgId,
                orchardId,
                treeId,
                { wateredUntil: nextWatering },
                newLog,
            )
        } catch (e) {
            // Revert tree update
            tree.data = { ...tree.data, wateredUntil: prevWatered, updatedAt: prevUpdated }

            const logState = logsByTreeId.value[treeId]
            if (logState?.items?.length && (logState.items[0] as any).id === undefined) {
                logState.items.shift()
            }
            throw e
        }
    }

    async function createTree(
        orgId: string,
        orchardId: string,
        data: Pick<Tree, 'name' | 'variety' | 'owner'>,
    ) {
        const treeSlug = generateSlug(data.name)
        const treeId = generateRandomId()
        const { Timestamp } = await import('firebase/firestore')
        const now = Timestamp.now()

        const newTree: Tree = {
            id: treeId,
            slug: treeSlug,
            name: data.name,
            type: 'tree',
            variety: data.variety || null,
            owner: data.owner,
            wateredUntil: null,
            createdBy: auth.fullName || 'user',
            createdAt: now,
            updatedAt: now,
        }

        // Optimistic update tree
        entities.value[treeId] = {
            data: newTree,
            hydratation: 'full',
            fetchedAt: Date.now(),
        }

        // Optimistic add tree to orchard index
        const idx = (indexByOrchard.value[orchardId] ??= { ids: [], fetchedAt: 0 })
        let pushed = false
        if (!idx.ids.includes(treeId)) {
            idx.ids.push(treeId)
            pushed = true
        }
        const createIndexNow = idx.ids.length === 1 // znamena ze index predtym neexistoval

        // Optimistic add treelog
        const newLog = createLogEntry({
            type: 'CREATE',
            by: auth.fullName,
            byId: auth.user?.uid || '',
            prevWateredUntil: null,
            newWateredUntil: null,
        })
        logsByTreeId.value[treeId] = {
            items: [newLog],
            fetchedAt: Date.now(),
        }

        try {
            await apiCreateTreeAndLog(orgId, orchardId, treeId, newTree, newLog)
        } catch (e) {
            // If problem remove local changes
            delete entities.value[treeId]
            delete logsByTreeId.value[treeId]
            if (pushed) idx.ids = idx.ids.filter((x) => x !== treeId)
            if (createIndexNow && idx.ids.length === 0) {
                delete indexByOrchard.value[orchardId]
            }

            throw e
        }
    }

    return {
        _orchardId,
        _orgId,

        fetchTrees,
        fetchTreeDetail,
        fetchLogsForTree,

        indexByOrchard,
        entities,
        logsByTreeId,

        listByOrchard,
        getById,
        getLogs,
        waterTreeNow,
        createTree,
    }
})

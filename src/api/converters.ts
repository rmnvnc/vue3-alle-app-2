import type { TreeLogEntry } from '@/types/logType'
import type { Tree } from '@/types/treeType'
import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore/lite'

export const treeConverter: FirestoreDataConverter<Tree> = {
    toFirestore(t) {
        return t
    },
    fromFirestore(snap: QueryDocumentSnapshot): Tree {
        const d = snap.data() as any
        return {
            id: snap.id,
            name: d.name,
            slug: d.slug,
            type: 'tree',
            createdBy: d.createdBy,
            createdAt: d.createdAt ?? null,
            updatedAt: d.updatedAt ?? null,
            wateredUntil: d.wateredUntil ?? null,
            owner: d.owner ?? null,
            variety: d.variety ?? null,
        } satisfies Tree
    },
}

export const logConverter: FirestoreDataConverter<TreeLogEntry> = {
    toFirestore(l) {
        return l
    },
    fromFirestore(snap: QueryDocumentSnapshot): TreeLogEntry {
        const d = snap.data() as any
        return {
            type: d.type,
            by: d.by,
            byId: d.byId,
            loggedAt: d.loggedAt ?? null,
            prevWateredUntil: d.prevWateredUntil ?? null,
            newWateredUntil: d.newWateredUntil ?? null,
        } as TreeLogEntry
    },
}

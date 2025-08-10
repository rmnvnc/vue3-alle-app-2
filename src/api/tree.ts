import { db } from '@/firebase'
import { TreeLogEntry } from '@/types/log'
import { Tree, TreeWithLogs } from '@/types/tree'
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
} from 'firebase/firestore'

export async function fetchTreesFromFirestore(orgId: string, orchardId: string) {
    const treeSnap = await getDocs(
        collection(db, 'organizations', orgId, 'orchards', orchardId, 'trees'),
    )
    return treeSnap.docs.map((doc) => {
        const data = doc.data()
        return {
            id: doc.id,
            name: data.name,
            slug: data.slug,
            wateredUntil: data.wateredUntil ?? null,
            owner: data.owner ?? null,
            variety: data.variety ?? null,
            createdAt: data.createdAt ?? null,
        }
    }) as Tree[]
}

export async function fetchTreeWithLogs(
    orgId: string,
    orchardId: string,
    treeId: string,
): Promise<TreeWithLogs> {
    const treeRef = doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
    const snap = await getDoc(treeRef)
    if (!snap.exists()) throw new Error('Tree not found')
    const treeData = snap.data() as Omit<Tree, 'id'>
    const tree: Tree = { id: snap.id, ...treeData }

    const logsRef = collection(treeRef, 'logs')
    const q = query(logsRef, orderBy('loggedAt', 'desc'), limit(5))
    const logSnap = await getDocs(q)

    const logs: TreeLogEntry[] = logSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TreeLogEntry, 'id'>),
    }))

    return {
        ...tree,
        logs,
    }
}

export async function addTreeToFirestore(
    orgId: string,
    orchardId: string,
    treeId: string,
    tree: Tree,
) {
    const ref = doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
    await setDoc(ref, {
        ...tree,
        createdAt: serverTimestamp(),
    })
}

export async function updateTreeInFirestore(
    orgId: string,
    orchardId: string,
    treeId: string,
    fields: Record<string, any>,
) {
    const ref = doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
    await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
    })
}

export async function addTreeLog(
    orgId: string,
    orchardId: string,
    treeId: string,
    log: TreeLogEntry,
) {
    const logsCol = collection(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
        treeId,
        'logs',
    )
    await addDoc(logsCol, log)
}

export function getNextWateringDate(fromDate: Date | Timestamp): Timestamp {
    const base = fromDate instanceof Timestamp ? fromDate.toDate() : fromDate
    const nextDate = new Date(base.getTime() + 14 * 24 * 60 * 60 * 1000)
    return Timestamp.fromDate(nextDate)
}

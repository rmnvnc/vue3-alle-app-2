import { getDb } from '@/firebase'
import type { TreeLogEntry } from '@/types/logType'
import type { Tree } from '@/types/treeType'
import type { UpdateData, Timestamp } from 'firebase/firestore/lite'
import { treeConverter, logConverter } from './converters'

export async function apiFetchTrees(orgId: string, orchardId: string): Promise<Tree[]> {
    const { collection, getDocs, query, where } = await import('firebase/firestore/lite')
    const db = await getDb()
    const colRef = collection(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
    ).withConverter(treeConverter)
    const snap = await getDocs(query(colRef, where('status', '==', 'active')))
    return snap.docs.map((d) => d.data())
}

export async function apiFetchTree(
    orgId: string,
    orchardId: string,
    treeId: string,
): Promise<Tree> {
    const { doc, getDoc } = await import('firebase/firestore/lite')
    const db = await getDb()
    const treeRef = doc(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
        treeId,
    ).withConverter(treeConverter)
    const treeSnap = await getDoc(treeRef)
    if (!treeSnap.exists()) throw new Error('Tree not found')

    return { ...treeSnap.data() }
}

export async function apiFetchTreeLogs(
    orgId: string,
    orchardId: string,
    treeId: string,
): Promise<TreeLogEntry[]> {
    const { collection, query, getDocs, orderBy, limit } = await import('firebase/firestore/lite')
    const db = await getDb()
    const logsCol = collection(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
        treeId,
        'logs',
    ).withConverter(logConverter)
    const logsSnap = await getDocs(query(logsCol, orderBy('loggedAt', 'desc'), limit(5)))
    return logsSnap.docs.map((d) => d.data())
}

export function getNextWateringDate(fromDate: Timestamp): Timestamp {
    const nextMs = fromDate.toMillis() + 14 * 24 * 60 * 60 * 1000 // +14 dní
    const Ctor = (fromDate as any).constructor as { fromMillis(ms: number): Timestamp }
    return Ctor.fromMillis(nextMs)
}

export async function apiUpdateTreeAndLog(
    orgId: string,
    orchardId: string,
    treeId: string,
    update: UpdateData<Tree>,
    log: TreeLogEntry,
) {
    const { collection, writeBatch, doc, serverTimestamp } = await import('firebase/firestore/lite')
    const db = await getDb()
    const batch = writeBatch(db)

    const treeRef = doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
    const logRef = doc(collection(treeRef, 'logs'))

    batch.update(treeRef, {
        ...update,
        updatedAt: serverTimestamp(),
    } as UpdateData<Tree>)

    batch.set(logRef, {
        ...log,
        loggedAt: serverTimestamp(),
    })

    await batch.commit()
}

export async function apiCreateTreeAndLog(
    orgId: string,
    orchardId: string,
    treeId: string,
    data: Tree,
    log: TreeLogEntry,
) {
    const { collection, writeBatch, doc, serverTimestamp } = await import('firebase/firestore/lite')
    const db = await getDb()
    const batch = writeBatch(db)

    const treeRef = doc(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
        treeId,
    ).withConverter(treeConverter)

    const logRef = doc(collection(treeRef, 'logs'))

    batch.set(treeRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    batch.set(logRef, {
        ...log,
        loggedAt: serverTimestamp(),
    })

    await batch.commit()
}

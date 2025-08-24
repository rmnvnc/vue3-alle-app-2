import { db } from '@/firebase'
import { TreeLogEntry } from '@/types/logType'
import { Tree } from '@/types/treeType'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    UpdateData,
    writeBatch,
} from 'firebase/firestore'
import { treeConverter, logConverter } from './converters'

export async function apiFetchTrees(orgId: string, orchardId: string): Promise<Tree[]> {
    const colRef = collection(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
    ).withConverter(treeConverter)
    const snap = await getDocs(colRef)
    return snap.docs.map((d) => d.data())
}

export async function apiFetchTree(
    orgId: string,
    orchardId: string,
    treeId: string,
): Promise<Tree> {
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
    const nextMillis = fromDate.toMillis() + 14 * 24 * 60 * 60 * 1000 // +14 dní
    return Timestamp.fromMillis(nextMillis)
}

export async function apiUpdateTreeAndLog(
    orgId: string,
    orchardId: string,
    treeId: string,
    update: UpdateData<Tree>,
    log: TreeLogEntry,
) {
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

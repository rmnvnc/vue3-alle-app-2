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
import { treeConverter, logConverter } from './converters'

export async function fetchTreesFromFirestore(orgId: string, orchardId: string): Promise<Tree[]> {
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

export async function fetchTreeWithLogs(
    orgId: string,
    orchardId: string,
    treeId: string,
): Promise<TreeWithLogs> {
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

    const logsCol = collection(treeRef, 'logs').withConverter(logConverter)
    const logsSnap = await getDocs(query(logsCol, orderBy('loggedAt', 'desc'), limit(50)))
    return { ...treeSnap.data(), logs: logsSnap.docs.map((d) => d.data()) }
}

export async function addTreeToFirestore(
    orgId: string,
    orchardId: string,
    treeId: string,
    tree: Omit<Tree, 'createdAt' | 'updatedAt'>,
) {
    const ref = doc(
        db,
        'organizations',
        orgId,
        'orchards',
        orchardId,
        'trees',
        treeId,
    ).withConverter(treeConverter)
    await setDoc(ref, {
        ...tree,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    } as unknown as Tree)
}

export async function updateTreeInFirestore(
    orgId: string,
    orchardId: string,
    treeId: string,
    update: Partial<Tree>,
) {
    const ref = doc(db, 'organizations', orgId, 'orchards', orchardId, 'trees', treeId)
    await updateDoc(ref, { ...update, updatedAt: serverTimestamp() })
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

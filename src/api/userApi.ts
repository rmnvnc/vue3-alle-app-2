import { getDb } from '@/firebase'
import type { UserData } from '@/types/userType'

export async function getUserData(uid: string): Promise<UserData | null> {
    const { doc, getDoc } = await import('firebase/firestore/lite')
    const db = await getDb()
    const ref = doc(db, 'users', uid)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return snapshot.data() as UserData
}

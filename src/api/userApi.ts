import { db } from '@/firebase'
import { UserData } from '@/types/userType'
import { doc, getDoc } from 'firebase/firestore'

export async function getUserData(uid: string): Promise<UserData | null> {
    const ref = doc(db, 'users', uid)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return snapshot.data() as UserData
}

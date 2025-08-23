import { auth } from '@/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth'

export async function login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
}

export async function logout() {
    await signOut(auth)
}

export function watchAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
}

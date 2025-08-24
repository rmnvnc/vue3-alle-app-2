import { getAuthInstance } from '@/firebase'
import type { User } from 'firebase/auth'

export async function login(email: string, password: string) {
    const auth = await getAuthInstance()
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
}

export async function logout() {
    const auth = await getAuthInstance()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
}

export async function watchAuthState(callback: (user: User | null) => void) {
    const auth = await getAuthInstance()
    const { onAuthStateChanged } = await import('firebase/auth')
    return onAuthStateChanged(auth, callback)
}

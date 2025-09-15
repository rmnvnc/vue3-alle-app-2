import { initializeApp } from 'firebase/app'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

let _db: import('firebase/firestore/lite').Firestore | null = null
let _auth: import('firebase/auth').Auth | null = null

export async function getDb() {
    if (_db) return _db
    const { getFirestore } = await import('firebase/firestore/lite')
    _db = getFirestore(app)
    return _db
}

export async function getAuthInstance() {
    if (_auth) return _auth
    const { getAuth } = await import('firebase/auth')
    _auth = getAuth(app)
    return _auth
}

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const roleLevel = ref(0)
    const fullName = ref(null)
    const isReady = ref(false)
    const isLoggedIn = computed(() => !!user.value)

    // rights by level
    const canWater = computed(() => roleLevel.value >= 1)
    const canEdit = computed(() => roleLevel.value >= 2)
    const isAdmin = computed(() => roleLevel.value >= 3)

    async function login(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
            throw error
        }
    }

    async function logout() {
        await signOut(auth)
        user.value = null
        data.fullName = null
        roleLevel.value = 0
    }

    function initAuth() {
        onAuthStateChanged(auth, async (firebaseUser) => {
            user.value = firebaseUser

            if (firebaseUser) {
                const userRef = doc(db, 'users', firebaseUser.uid)
                const snap = await getDoc(userRef)

                if (snap.exists()) {
                    const data = snap.data()
                    roleLevel.value = data.roleLevel || 0
                    fullName.value = data.fullName
                }
            }

            isReady.value = true
        })
    }

    return {
        user,
        isReady,
        isLoggedIn,
        fullName,
        login,
        logout,
        initAuth,
        //ROLES
        canWater,
        canEdit,
        isAdmin
    }
})
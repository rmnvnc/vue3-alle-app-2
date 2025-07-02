import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isReady = ref(false)
    const isLoggedIn = computed(() => !!user.value)

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
    }

    function initAuth() {
        onAuthStateChanged(auth, firebaseUser => {
            user.value = firebaseUser
            isReady.value = true
            // isLoading.value = false
        })
    }

    return {
        user,
        isReady,
        isLoggedIn,
        login,
        logout,
        initAuth
    }
})
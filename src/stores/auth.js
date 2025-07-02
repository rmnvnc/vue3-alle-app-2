import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    // const isLoading = ref(true)
    const isReady = ref(false)
    const error = ref(null)
    const isLoggedIn = computed(() => !!user.value)

    async function login(email, password) {
        // isLoading.value = true
        error.value = null
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (e) {
            error.value = e.message
        } finally {
            // isLoading.value = false
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
        // isLoading,
        isReady,
        isLoggedIn,
        error,
        login,
        logout,
        initAuth
    }
})
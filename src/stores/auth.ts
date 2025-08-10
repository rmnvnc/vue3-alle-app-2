import type { User } from 'firebase/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as apiLogin, logout as apiLogout, watchAuthState } from '@/api/auth'
import { getUserData } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const fullName = ref<string | null>(null)
    const roleLevel = ref(0)
    const isReady = ref(false)
    const isLoggedIn = computed(() => !!user.value)
    // rights by level
    const canWater = computed(() => roleLevel.value >= 1)
    const canEdit = computed(() => roleLevel.value >= 2)
    const isAdmin = computed(() => roleLevel.value >= 3)

    async function login(email: string, password: string) {
        await apiLogin(email, password)
    }

    async function logout() {
        await apiLogout()
        user.value = null
        fullName.value = null
        roleLevel.value = 0
    }

    function initAuth() {
        watchAuthState(async (firebaseUser) => {
            user.value = firebaseUser
            isReady.value = true
            if (firebaseUser) {
                const data = await getUserData(firebaseUser.uid)
                if (data) {
                    fullName.value = data.fullName
                    roleLevel.value = data.roleLevel
                }
            }
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
        isAdmin,
    }
})

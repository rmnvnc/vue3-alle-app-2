<template>
    <header>
        <template v-if="auth.isLoggedIn">
            Vitaj, {{ auth.user.email }} <base-button @click="auth.logout()">Odhlásiť</base-button>
            <span class="role-check">
                <span class="active">Sledovať</span><br>
                <span :class="{ active: auth.canWater }">Polievať</span><br>
                <span :class="{ active: auth.canEdit }">Editovať</span><br>
                <span :class="{ active: auth.isAdmin }">Admin</span>
            </span>
        </template>
    </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.role-check span:not(.active) {
    opacity: .6;
}

header {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
}
</style>
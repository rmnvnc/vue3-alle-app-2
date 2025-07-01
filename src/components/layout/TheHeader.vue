<template>
    <header>
        The Header
        <span v-if="auth.isLoggedIn">
            <br>Vitaj, {{ auth.user.email }} <base-button @click="auth.logout()">Odhlásiť</base-button>
        </span>
    </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
</script>

<style scoped></style>
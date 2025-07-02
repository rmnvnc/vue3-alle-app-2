<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import BaseBreadcrumbs from '@/components/ui/BaseBreadcrumbs.vue'
import { useAuthStore } from '@/stores/auth'
import { watch } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

watch(
    () => auth.isLoggedIn,
    (loggedIn) => {
        if (auth.isReady && !loggedIn && route.meta.requiresAuth) {
            router.push({name: 'login', query: {redirect: route.fullPath}})
        }
    }
)
</script>

<template>
    <the-header></the-header>
    <BaseBreadcrumbs />
    <router-view v-slot="slotProps">
        <transition name="route" mode="out-in">
            <component :is="slotProps.Component"></component>
        </transition>
    </router-view>
</template>

<style scoped>
.route-enter-from {
    opacity: 0;
    transform: translateY(30px);
}

.route-leave-to {
    opacity: 0;
    transform: translateY(-30px);
}

.route-enter-active {
    transition: all .3s ease-out;
}

.route-leave-active {
    transition: all .3s ease-in;
}

.route-enter-to,
.route-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
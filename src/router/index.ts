import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
    },
    {
        path: '/',
        name: 'orchard-view',
        component: () => import('@/views/OrchardView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/:treeId-:treeSlug',
        name: 'tree-view',
        component: () => import('@/views/TreeView.vue'),
        props: true,
        meta: { requiresAuth: true },
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        if (to.fullPath === '/') return { name: 'login', replace: true }
        return { name: 'login', query: { redirect: to.fullPath }, replace: true }
    }
    return true
})

export default router

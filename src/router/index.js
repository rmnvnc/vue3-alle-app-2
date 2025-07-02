import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
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
        }
    ],
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    if (!auth.isReady) {
        const unwatch = auth.$subscribe((_, state) => {
            if (state.isReady) {
                unwatch()
                proceed()
            }
        })
    } else {
        proceed()
    }

    function proceed() {
        if (!to.meta.requiresAuth) {
            return next()
        }
        if (!auth.user) {
            if (to.fullPath === '/') {
                return next({ name: 'login', replace: true });
            }
            return next({
                name: 'login',
                query: { redirect: to.fullPath },
                replace: true
            });
        }
        next()
    }

})

export default router

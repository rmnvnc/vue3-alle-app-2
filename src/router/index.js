import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'org-list',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/:orgId',
            name: 'org-view',
            props: true,
            component: () => import('@/views/OrgView.vue'),
            meta: { requiresAuth: true },
        },
        {
            path: '/:orgId/:orchardId',
            name: 'orchard-view',
            component: () => import('@/views/OrchardView.vue'),
            props: true,
            meta: { requiresAuth: true },
        },
        {
            path: '/:orgId/:orchardId/:treeId-:treeSlug',
            name: 'tree-view',
            component: () => import('@/views/TreeView.vue'),
            props: true,
            meta: { requiresAuth: true },
        }
    ],
})

export default router

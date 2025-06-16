import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'org-list',
            component: HomeView,
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
            path: '/:orgId/:orchardId/:treeParam',
            name: 'tree-view',
            component: () => import('@/views/TreeView.vue'),
            props: true,
            meta: { requiresAuth: true },
        }
        // {
        //   path: '/about',
        //   name: 'about',
        // route level code-splitting
        // this generates a separate chunk (About.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        //   component: () => import('../views/AboutView.vue'),
        // },
    ],
})

export default router

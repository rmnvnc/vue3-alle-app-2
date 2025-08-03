<template>
    <nav aria-label="Breadcrumb" class="breadcrumbs">
        <ul>
            <li v-for="(crumb, i) in crumbs" :key="i">
                <RouterLink v-if="i < crumbs.length - 1" :to="crumb.to">
                    {{ crumb.label }}
                </RouterLink>
                <span v-else>{{ crumb.label }}</span>
            </li>
        </ul>

    </nav>
</template>

<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

export interface BreadCrumbItem {
    label: string
    to: string
}

const crumbs: ComputedRef<BreadCrumbItem[]> = computed(() => {
    const parts = route.path.split('/').filter(Boolean)

    const list: BreadCrumbItem[] = [{ label: 'Domov', to: '/' }]

    parts.forEach((segment, idx) => {
        const to = '/' + parts.slice(0, idx + 1).join('/')
        let label: string

        if (router.currentRoute.value.name === 'tree-view' && idx === parts.length - 1) {
            label = route.params.treeSlug as string
        } else {
            const raw = decodeURIComponent(segment)
            label = raw
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
        }

        list.push({ label, to })
    });

    return list
})
</script>

<style scoped>
.breadcrumbs ul {
    display: flex;
    flex-wrap: wrap;
    list-style-type: none;
    padding-left: unset;
    margin: .5rem 0 1rem;
}

.breadcrumbs li:not(:last-child)::after {
    content: '/';
    margin: 0 .5rem;
}
</style>
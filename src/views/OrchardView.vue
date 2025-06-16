<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrganizationsStore } from '@/stores/organizations'
import { storeToRefs } from 'pinia'
import { useRemainingTime } from '@/composables/useRemainingTime'

const route = useRoute()

const orgId = computed(() => route.params.orgId)
const orchardId = computed(() => route.params.orchardId)

const orgStore = useOrganizationsStore()
const { organization, orchards, treesByOrchard, loading, error } = storeToRefs(orgStore)

onMounted(async () => {
    // Did i need fetchOrganization???
    // if (!organization.value || organization.value.id !== orgId.value) {
    //     await orgStore.fetchOrganization(orgId.value)
    // }

    await orgStore.fetchTrees(orgId.value, orchardId.value)
})

const trees = computed(() => {
    const list = treesByOrchard.value[orchardId.value] || []
    return list.map(tree => {
        const { remaining } = useRemainingTime(tree.wateredUntil)
        return {
            ...tree,
            remaining,
        }
    })
})
</script>

<template>
    <main>
        <div v-if="loading">Loading…</div>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
            <h2>Orchard: {{ orchardId }}</h2>
            <ul>
                <li v-for="tree in trees" :key="tree.id">
                    <router-link :to="{
                        name: 'tree-view',
                        params: { orgId: orgId, orchardId: orchardId, treeParam: `${tree.id}-${tree.slug}` }
                    }">
                        {{ tree.name }} - {{ tree.remaining }}
                    </router-link>
                </li>
            </ul>
        </div>
    </main>
</template>

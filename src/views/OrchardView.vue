<script setup>
import { onMounted, computed } from 'vue'
import { useOrganizationsStore } from '@/stores/organizations'
import { storeToRefs } from 'pinia'
import TreeListItem from '@/components/trees/TreeListItem.vue'

const { orgId, orchardId } = defineProps(['orgId', 'orchardId'])

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTreesForOrchard } = useOrganizationsStore()

onMounted(async () => {
    await orgStore.fetchTrees(orgId, orchardId)
})

const trees = computed(() => {
    const list = getTreesForOrchard(orchardId)

    return [...list].sort((a, b) => {
        return a.wateredUntil - b.wateredUntil
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
                <tree-list-item v-for="tree in trees" :key="tree.id" :tree="tree" :orgId="orgId" :orchardId="orchardId">
                </tree-list-item>
            </ul>
        </div>
    </main>
</template>

<style scoped>
ul {
    padding: unset;
    list-style: none;
}
</style>
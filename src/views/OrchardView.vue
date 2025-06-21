<script setup>
import { onMounted, computed, ref } from 'vue'
import { useOrganizationsStore } from '@/stores/organizations'
import { storeToRefs } from 'pinia'
import TreeListItem from '@/components/trees/TreeListItem.vue'
import TreeForm from '@/components/trees/TreeForm.vue'

const { orgId, orchardId } = defineProps(['orgId', 'orchardId'])

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTreesForOrchard } = orgStore
const { addTree } = orgStore

onMounted(async () => {
    await orgStore.fetchTrees(orgId, orchardId)
})

const trees = computed(() => {
    const list = getTreesForOrchard(orchardId)

    return [...list].sort((a, b) => {
        return a.wateredUntil - b.wateredUntil
    })
})

const showTreeForm = ref(false);

function handleTreeForm() {
    showTreeForm.value = !showTreeForm.value;
}

function saveData(data) {
    addTree(orgId, orchardId, data)
}

</script>

<template>
    <main>
        <base-dialog title="Pridať strom" :show="showTreeForm" @close="handleTreeForm">
            <tree-form @save-data="saveData" />
        </base-dialog>
        <div v-if="loading">Loading…</div>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
            <h2>Orchard: {{ orchardId }}</h2>
            <base-button @click="handleTreeForm">Pridať strom</base-button>
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
<script setup>
import { onMounted, computed, ref } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations';
import { useRemainingTime } from '@/composables/useRemainingTime';

const orgStore = useOrganizationsStore()
const { getTreeData } = orgStore

const { orgId, orchardId, treeId, treeSlug } = defineProps(['orgId', 'orchardId', 'treeId', 'treeSlug'])

const loading = ref(false)
const error = ref('')

onMounted(async () => {
    loading.value = true
    try {
        await orgStore.fetchTree(orgId, orchardId, treeId)
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
})

const tree = getTreeData(treeId)

const { remainingText } = useRemainingTime(
    computed(() => tree.value?.wateredUntil ?? null)
)
</script>

<template>
    <main>
        <base-spinner v-if="loading">Načítavam strom…</base-spinner>
        <div v-else-if="error">Chyba: {{ error }}</div>
        <div v-else-if="tree">
            <small>TreeId: {{ treeId }}</small>
            <h1>{{ tree.name }}</h1>
            <template v-if="tree.owner">
                <span>Majiteľ: {{ tree.owner }}</span>
                <br>
            </template>
            <template v-if="tree.variety">
                <span>Odroda: {{ tree.variety }}</span>
                <br>
            </template>
            {{ remainingText }}
        </div>
    </main>
</template>

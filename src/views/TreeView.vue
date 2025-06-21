<script setup>
import { onMounted, computed } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations';
import { storeToRefs } from 'pinia';
import { useRemainingTime } from '@/composables/useRemainingTime';

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTreeData } = orgStore

const { orgId, orchardId, treeId, treeSlug } = defineProps(['orgId', 'orchardId', 'treeId', 'treeSlug'])

onMounted(async () => {
    await orgStore.fetchTree(orgId, orchardId, treeId)
})

const tree = getTreeData(treeId)

const { remainingText } = useRemainingTime(
    computed(() => tree.value?.wateredUntil ?? null)
)
</script>

<template>
    <main>
        <div v-if="loading">Načítavam strom…</div>
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

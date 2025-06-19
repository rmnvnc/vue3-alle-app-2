<script setup>
import { onMounted, computed } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations';
import { storeToRefs } from 'pinia';
import { useRemainingTime } from '@/composables/useRemainingTime';

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTree } = orgStore

const { orgId, orchardId, treeId, treeSlug } = defineProps(['orgId', 'orchardId', 'treeId', 'treeSlug'])

onMounted(async () => {
    await orgStore.fetchTree(orgId, orchardId, treeId)
})

const tree = computed(() => getTree(treeId))
const { remainingText } = useRemainingTime(
    computed(() => tree.value?.data?.wateredUntil ?? null)
)
</script>

<template>
    <main>
        <div v-if="loading">Načítavam strom…</div>
        <div v-else-if="error">Chyba: {{ error }}</div>
        <div v-else-if="tree.data">
            <small>TreeId: {{ treeId }}</small>
            <h1>{{ tree.data.name }}</h1>
            <template v-if="tree.data.owner">
                <span>Majiteľ: {{ tree.data.owner }}</span>
                <br>
            </template>
            <template v-if="tree.data.variety">
                <span>Odroda: {{ tree.data.variety }}</span>
                <br>
            </template>
            {{ remainingText }}
        </div>
    </main>
</template>

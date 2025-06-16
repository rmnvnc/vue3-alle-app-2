<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useOrganizationsStore } from '@/stores/organizations';
import { storeToRefs } from 'pinia';
import { useRemainingTime } from '@/composables/useRemainingTime';

const orgStore = useOrganizationsStore()
const { treeDetail, loading, error } = storeToRefs(orgStore)

const { orgId, orchardId, treeParam } = useRoute().params

// I need clear treeId
const [treeId, ...slugParts] = treeParam.split('-')
// const slug = slugParts.join('-')

onMounted(() => {
    orgStore.fetchTree(orgId, orchardId, treeId)
})

const wateredUntil = computed(() => treeDetail.value?.wateredUntil || null)
const { remaining } = useRemainingTime(wateredUntil)
</script>

<template>
    <main>
        <div v-if="loading">Načítavam strom…</div>
        <div v-else-if="error">Chyba: {{ error }}</div>
        <div v-else-if="treeDetail">
            <small>TreeId: {{ treeId }}</small>
            <h1>{{ treeDetail.name }}</h1>
            {{ remaining }}
        </div>
    </main>
</template>

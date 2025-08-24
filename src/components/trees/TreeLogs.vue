<template>
    <h2>Záznam posledných aktivít</h2>
    <div v-if="loading">
        <base-spinner />
    </div>
    <ul v-else>
        <li v-for="log in logs" :key="log.loggedAt.toMillis()" :class="log.type.toLocaleLowerCase()">
            <strong>{{ formatDate(log.loggedAt) }}</strong><br>
            <strong>{{ log.by === 'rain' ? 'Dážď' : log.by }}</strong>
            <template v-if="log.type === 'CREATE'">
                vytvoril strom.
            </template>
            <template v-else-if="log.newWateredUntil">
                zalial strom do {{ formatDate(log.newWateredUntil) }}.
            </template>
        </li>
    </ul>
</template>

<script setup lang="ts">
import type { Timestamp } from 'firebase/firestore';
import { useTreesStore } from '@/stores/treesStore'
import { computed, onMounted, ref } from 'vue';

const { _orgId, _orchardId, fetchLogsForTree, getLogs } = useTreesStore()
const props = defineProps<{ treeId: string }>()

const loading = ref(false)
const logs = computed(() => getLogs(props.treeId))

onMounted(async () => {
    try {
        await fetchLogsForTree(_orgId, _orchardId, props.treeId)
    } catch (e) {
        console.log(e)
    }
})

function formatDate(ts: Timestamp | null): string {
    return ts?.toDate().toLocaleDateString('sk-SK') ?? ''
}
</script>

<style lang="scss" scoped>
li {
    margin-bottom: .5rem;

    &.manual_watering {
        color: var(--color-success);
    }

    &.auto_watering {
        color: var(--color-info);
    }
}
</style>

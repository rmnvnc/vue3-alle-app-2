<template>
    <h2>Záznam posledných aktivít</h2>
    <ul>
        <li v-for="log in logs" :key="log.loggedAt.toMillis()" class="log-type" :class="log.type.toLocaleLowerCase()">
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
import { TreeLogEntry } from '@/types/logType';
import { Timestamp } from 'firebase/firestore';

defineProps<{ logs: TreeLogEntry[] }>()

function formatDate(ts: Timestamp | null): string {
    return ts?.toDate().toLocaleDateString('sk-SK') ?? ''
}
</script>

<style lang="scss" scoped>
li {
    margin-bottom: .5rem;
}

.log-type {
    &.manual_watering {
        color: var(--color-success);
    }

    &.auto_watering {
        color: var(--color-info);
    }
}
</style>

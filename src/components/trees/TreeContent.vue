<template>
    <base-toast :show="waterringError" @close="waterringError = false" message="Nastala chyba pri zalievaní"
        type="error" />
    <base-toast :show="showToast" @close="showToast = false" message="Strom úspešne zaliaty" type="success" />
    <template v-if="fetchError">
        <p style="color: red;">Nepodarilo sa načítať strom. Skús to neskôr.</p>
    </template>
    <template v-if="tree">
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
        <base-button @click="waterTreeNow()" :disabled="buttonCooldown || waterringError || !auth.canWater"
            class="add-tree">Zaliať
            strom</base-button>
        <tree-logs :logs="recentLogs" />
    </template>
</template>

<script setup lang="ts">
import { useTreesStore } from '@/stores/trees'
import { useAuthStore } from '@/stores/auth.js'
import TreeLogs from './TreeLogs.vue';
import { ref, computed, ComputedRef } from 'vue';
import { useRemainingTime } from '@/composables/useRemainingTime.js'
import { TreeLogEntry } from '@/types/log';
import { Timestamp } from 'firebase/firestore';

const props = defineProps<{ treeId: string }>()
const auth = useAuthStore()

const { _orgId, _orchardId, fetchTree, getTreeData, waterTree } = useTreesStore()

const fetchError = ref(false)
try {
    await fetchTree(_orgId, _orchardId, props.treeId)
} catch (e) {
    fetchError.value = true
}

const tree = getTreeData(props.treeId)

const { remainingText }: { remainingText: ComputedRef<string> } = useRemainingTime(
    computed(() => tree.value?.wateredUntil ?? null)
)

const recentLogs = computed<TreeLogEntry[]>(() => {
    const logs = tree.value?.logs ?? []
    return [...logs].slice(0, 5)
});

const showToast = ref(false)
const buttonCooldown = ref(false)
const waterringError = ref(false)

async function waterTreeNow(): Promise<void> {
    showToast.value = false
    buttonCooldown.value = true
    try {
        await waterTree(_orgId, _orchardId, props.treeId, tree.value?.wateredUntil ?? Timestamp.now())

        showToast.value = true
        setTimeout(() => {
            buttonCooldown.value = false
        }, 10000)
    } catch (error) {
        waterringError.value = true
    }
}
</script>

<style scoped>
.add-tree,
h1 {
    margin-block: 16px;
}
</style>
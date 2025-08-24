<template>
    <base-toast :show="wateringError.show" @close="wateringError.show = false"
        :message="wateringError.message || 'Nastala chyba pri zalievaní'" type="error" />
    <base-toast :show="succesToast" @close="succesToast = false" message="Strom úspešne zaliaty" type="success" />
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
        <base-button @click="waterTree()" :disabled="buttonCooldown || wateringError.show || !auth.canWater"
            class="add-tree">Zaliať
            strom</base-button>
        <tree-logs :treeId="tree?.id" />
    </template>
</template>

<script setup lang="ts">
import { useTreesStore } from '@/stores/treesStore'
import { useAuthStore } from '@/stores/authStore'
import TreeLogs from './TreeLogs.vue';
import { ref, computed, onMounted, reactive } from 'vue';
import { useRemainingTime } from '@/composables/useRemainingTime'
import { FirebaseError } from 'firebase/app';

const props = defineProps<{ treeId: string }>()
const auth = useAuthStore()

const { _orgId, _orchardId, fetchTreeDetail, getById, waterTreeNow } = useTreesStore()

const fetchError = ref(false)

onMounted(async () => {
    try {
        await fetchTreeDetail(_orgId, _orchardId, props.treeId)
    } catch (e) {
        fetchError.value = true
    }
})

const tree = computed(() => getById(props.treeId))

const { remainingText } = useRemainingTime(
    computed(() => tree.value?.wateredUntil ?? null)
)

const succesToast = ref(false)
const buttonCooldown = ref(false)
const wateringError = reactive({
    message: '',
    show: false
})

async function waterTree(): Promise<void> {
    succesToast.value = false
    buttonCooldown.value = true
    try {
        await waterTreeNow(_orgId, _orchardId, props.treeId)
        succesToast.value = true
    } catch (error) {
        const err = error as FirebaseError
        wateringError.message = err.message
        wateringError.show = true
    } finally {
        setTimeout(() => {
            buttonCooldown.value = false
        }, 10000)
    }
}
</script>

<style scoped>
.add-tree,
h1 {
    margin-block: 16px;
}
</style>

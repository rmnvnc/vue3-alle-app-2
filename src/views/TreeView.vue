<template>
    <main>
        <base-toast :show="waterringError" @close="waterringError = false" message="Nastala chyba pri zalievaní"
            type="error" />
        <base-toast :show="showToast" @close="showToast = false" message="Strom úspešne zaliaty" type="success" />
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
            <base-button @click="wTree()" :disabled="buttonCooldown || waterringError || !auth.canWater"
                class="add-tree">Zaliať
                strom</base-button>
        </div>
    </main>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations';
import { useRemainingTime } from '@/composables/useRemainingTime';
import { useAuthStore } from '@/stores/auth'

const orgStore = useOrganizationsStore()
const { getTreeData, waterTree, _orgId, _orchardId } = orgStore

const { treeId, treeSlug } = defineProps(['treeId', 'treeSlug'])
const auth = useAuthStore()

const loading = ref(false)
const error = ref('')

onMounted(async () => {
    loading.value = true
    try {
        await orgStore.fetchTree(_orgId, _orchardId, treeId)
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

const showToast = ref(false)
const buttonCooldown = ref(false)
const waterringError = ref(false)

async function wTree() {
    showToast.value = false
    buttonCooldown.value = true
    try {
        await waterTree(_orgId, _orchardId, treeId, tree.value.wateredUntil)

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

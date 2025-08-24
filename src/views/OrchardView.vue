<template>
    <main>
        <base-toast :show="showToast" @close="showToast = false" message="Strom úspešne pridaný" type="success" />
        <base-dialog title="Pridať strom" :show="showTreeForm" @close="handleTreeForm">
            <tree-form @save-data="saveData" :form-loading="formLoading" :form-error="formError" />
        </base-dialog>

        <h1>Orchard: {{ _orchardId }}</h1>
        <base-button @click="handleTreeForm" :disabled="!auth.canEdit || error != ''">Pridať strom</base-button>
        <div v-if="error">Error: {{ error }}</div>
        <base-spinner v-else-if="loading"></base-spinner>
        <tree-list v-else :items="trees"></tree-list>
    </main>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useTreesStore } from '@/stores/treesStore'
import { useAuthStore } from '@/stores/authStore'
import TreeList from '@/components/trees/TreeList.vue'
import TreeForm from '@/components/trees/TreeForm.vue'
import { FirebaseError } from 'firebase/app'
import { Tree } from '@/types/treeType'

const treesStore = useTreesStore()
const { createTree, _orgId, _orchardId, listByOrchard } = treesStore

const auth = useAuthStore()

const loading = ref(false)
const error = ref('')

onMounted(async () => {
    loading.value = true;
    error.value = ''
    try {
        await treesStore.fetchTrees(_orgId, _orchardId)
    } catch (e) {
        const err = e as FirebaseError
        error.value = err.message
    } finally {
        loading.value = false
    }
})

const trees = computed(() => {
    return listByOrchard(_orchardId)
        .slice()
        .sort((a: Tree, b: Tree) => {
            const aHasWater = a.wateredUntil != null
            const bHasWater = b.wateredUntil != null
            if (!aHasWater && !bHasWater) {
                const aMs = a.createdAt?.toMillis?.() ?? 0
                const bMs = b.createdAt?.toMillis?.() ?? 0
                return bMs - aMs
            }
            if (!aHasWater) return -1
            if (!bHasWater) return 1
            return a.wateredUntil!.toMillis() - b.wateredUntil!.toMillis()
        })
})

const showTreeForm = ref(false);

function handleTreeForm() {
    showTreeForm.value = !showTreeForm.value
    formError.value = ''
}

const formLoading = ref(false)
const showToast = ref(false)
const formError = ref('')

async function saveData(data: { name: string; variety: string; owner: string }) {
    formLoading.value = true
    showToast.value = false
    formError.value = ''
    try {
        await createTree(_orgId, _orchardId, data)
        handleTreeForm()
        showToast.value = true
    } catch (e) {
        const err = e as FirebaseError
        formError.value = err.message || 'Nastala neočakávaná chyba.'
    } finally {
        formLoading.value = false
    }
}

</script>

<style scoped>
h1 {
    margin-bottom: 1rem;
}
</style>

<template>
    <main>
        <base-toast :show="showToast" @close="showToast = false" message="Strom úspešne pridaný" type="success" />
        <base-dialog title="Pridať strom" :show="showTreeForm" @close="handleTreeForm">
            <tree-form @save-data="saveData" :form-loading="formLoading" :form-error="formError" />
        </base-dialog>
        <base-spinner v-if="loading"></base-spinner>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
            <h1>Orchard: {{ _orchardId }}</h1>
            <base-button @click="handleTreeForm" :disabled="!auth.canEdit">Pridať strom</base-button>
            <transition-group name="tree" tag="ul">
                <tree-list-item v-for="tree in trees" :key="tree.id" :tree="tree">
                </tree-list-item>
            </transition-group>
        </div>
    </main>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useTreesStore } from '@/stores/trees.ts'
import TreeListItem from '@/components/trees/TreeListItem.vue'
import TreeForm from '@/components/trees/TreeForm.vue'
import { useAuthStore } from '@/stores/auth'

const treesStore = useTreesStore()
const { getTreesForOrchard, addTree, _orgId, _orchardId } = treesStore

const auth = useAuthStore()

const loading = ref(false)
const error = ref('')

onMounted(async () => {
    loading.value = true;
    error.value = ''
    try {
        await treesStore.fetchTrees(_orgId, _orchardId)
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
})

const trees = computed(() => {
    return getTreesForOrchard(_orchardId)
        .slice()
        .sort((a, b) => {
            const aHasWater = a.wateredUntil != null
            const bHasWater = b.wateredUntil != null

            if (!aHasWater && !bHasWater) {
                const aMs = a.createdAt instanceof Date
                    ? a.createdAt.getTime()
                    : a.createdAt?.toMillis?.() ?? 0

                const bMs = b.createdAt instanceof Date
                    ? b.createdAt.getTime()
                    : b.createdAt?.toMillis?.() ?? 0

                return bMs - aMs
            }

            if (!aHasWater) return -1
            if (!bHasWater) return 1

            return a.wateredUntil - b.wateredUntil
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

async function saveData(data) {
    formLoading.value = true
    showToast.value = false
    formError.value = ''
    try {
        await addTree(_orgId, _orchardId, data)
        handleTreeForm()
        showToast.value = true
    } catch (error) {
        formError.value = error.message || 'Nastala neočakávaná chyba.'
    } finally {
        formLoading.value = false
    }
}

</script>

<style scoped>
ul {
    padding: unset;
    list-style: none;
    margin-top: 2rem;
}

h1 {
    margin-bottom: 1rem;
}

.tree-enter-from,
.tree-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}

.tree-enter-active,
.tree-leave-active {
    transition: all .5s ease;
}
</style>
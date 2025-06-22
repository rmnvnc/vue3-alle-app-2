<script setup>
import { onMounted, computed, ref } from 'vue'
import { useOrganizationsStore } from '@/stores/organizations'
import TreeListItem from '@/components/trees/TreeListItem.vue'
import TreeForm from '@/components/trees/TreeForm.vue'

const { orgId, orchardId } = defineProps(['orgId', 'orchardId'])

const orgStore = useOrganizationsStore()
const { getTreesForOrchard } = orgStore
const { addTree } = orgStore

const loading = ref(false)
const error = ref('')

onMounted(async () => {
    loading.value = true;
    error.value = ''
    try {
        await orgStore.fetchTrees(orgId, orchardId)
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
})

const trees = computed(() => {
    return getTreesForOrchard(orchardId)
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
const formSuccess = ref(false)
const formError = ref('')

async function saveData(data) {
    formLoading.value = true
    formSuccess.value = false
    formError.value = ''
    try {
        await addTree(orgId, orchardId, data)
        handleTreeForm()
        formSuccess.value = true
    } catch (error) {
        formError.value = error.message || 'Nastala neočakávaná chyba.'
    } finally {
        formLoading.value = false
    }
}

</script>

<template>
    <main>
        <base-toast v-if="formSuccess" message="Strom úspešne pridaný" type="success" />
        <base-dialog title="Pridať strom" :show="showTreeForm" @close="handleTreeForm">
            <tree-form @save-data="saveData" :form-loading="formLoading" :form-error="formError" />
        </base-dialog>
        <base-spinner v-if="loading"></base-spinner>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
            <h1>Orchard: {{ orchardId }}</h1>
            <base-button @click="handleTreeForm">Pridať strom</base-button>
            <transition-group name="tree" tag="ul">
                <tree-list-item v-for="tree in trees" :key="tree.id" :tree="tree" :orgId="orgId" :orchardId="orchardId">
                </tree-list-item>
            </transition-group>
        </div>
    </main>
</template>

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
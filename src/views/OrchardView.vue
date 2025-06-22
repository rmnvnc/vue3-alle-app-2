<script setup>
import { onMounted, computed, ref } from 'vue'
import { useOrganizationsStore } from '@/stores/organizations'
import { storeToRefs } from 'pinia'
import TreeListItem from '@/components/trees/TreeListItem.vue'
import TreeForm from '@/components/trees/TreeForm.vue'

const { orgId, orchardId } = defineProps(['orgId', 'orchardId'])

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTreesForOrchard } = orgStore
const { addTree } = orgStore

onMounted(async () => {
    await orgStore.fetchTrees(orgId, orchardId)
})

const trees = computed(() => {
    const list = getTreesForOrchard(orchardId)

    return [...list].sort((a, b) => {
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
        console.log(error)
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
            <h2>Orchard: {{ orchardId }}</h2>
            <base-button @click="handleTreeForm">Pridať strom</base-button>
            <ul>
                <tree-list-item v-for="tree in trees" :key="tree.id" :tree="tree" :orgId="orgId" :orchardId="orchardId">
                </tree-list-item>
            </ul>
        </div>
    </main>
</template>

<style scoped>
ul {
    padding: unset;
    list-style: none;
}
</style>
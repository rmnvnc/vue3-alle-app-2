<script setup>
import { onMounted, computed } from 'vue'
import { useOrganizationsStore } from '@/stores/organizations'
import { storeToRefs } from 'pinia'
import { useRemainingTime } from '@/composables/useRemainingTime'

const { orgId, orchardId } = defineProps(['orgId', 'orchardId'])

const orgStore = useOrganizationsStore()
const { loading, error } = storeToRefs(orgStore)
const { getTreesForOrchard } = useOrganizationsStore()

onMounted(async () => {
    await orgStore.fetchTrees(orgId, orchardId)
})

const trees = computed(() => {
    const list = getTreesForOrchard(orchardId)

    return [...list].sort((a, b) => {
        return a.wateredUntil - b.wateredUntil
    })
})

</script>

<template>
    <main>
        <div v-if="loading">Loading…</div>
        <div v-else-if="error">Error: {{ error }}</div>
        <div v-else>
            <h2>Orchard: {{ orchardId }}</h2>
            <ul>
                <li v-for="tree in trees" :key="tree.id">
                    <router-link v-if="tree.slug && tree.id" :to="{
                        name: 'tree-view',
                        params: { orgId: orgId, orchardId: orchardId, treeId: tree.id, treeSlug: tree.slug }
                    }">
                        {{ tree.name }} - {{ tree.remaining }}
                        <br>
                        {{ tree.wateredUntil }}
                        Majitel: nikto<br>
                        Odroda: Nijaka
                    </router-link>
                    <span v-else>
                        {{ tree.name }} - {{ tree.remaining }}
                    </span>
                </li>
            </ul>
        </div>
    </main>
</template>

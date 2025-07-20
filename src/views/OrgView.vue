<script setup>
import { onMounted } from 'vue';
import { useTreesStore } from '@/stores/organizations';
import { storeToRefs } from 'pinia';

const treesStore = useTreesStore()
const { organization, orchards, loading, error } = storeToRefs(treesStore)

const { orgId } = defineProps(['orgId'])

onMounted(() => {
    treesStore.fetchOrganization(orgId)
})

</script>

<template>
    <main>
        <div v-if="loading">Načítavam organizáciu…</div>
        <div v-else-if="error">Chyba: {{ error }}</div>
        <div v-else-if="organization">
            {{ organization.name }}

            <ul v-if="orchards">
                <li v-for="orchard in orchards" :key="orchard.id">
                    <router-link :to="{
                        name: 'orchard-view',
                        params: { orgId: orgId, orchardId: orchard.id }
                    }">
                        Prejsť na sad {{ orchard.name }}
                    </router-link>
                </li>

            </ul>
        </div>
    </main>
</template>
<template>
    <li>
        <router-link v-if="tree.slug && tree.id" :to="{
            name: 'tree-view',
            params: { orgId: orgId, orchardId: orchardId, treeId: tree.id, treeSlug: tree.slug }
        }">{{ tree.name }}
            <br>
            {{ remainingText }}

            {{ remainingDays }}
            <template v-if="tree.owner">
                <br>
                Majitel: {{ tree.owner }}
            </template>
            <template v-if="tree.variety">
                <br>
                Odroda: {{ tree.variety }}
            </template>
        </router-link>
        <span v-else>
            {{ tree.name }}
        </span>
    </li>
</template>

<script setup>
import { useRemainingTime } from '@/composables/useRemainingTime'
import { computed } from 'vue'

const props = defineProps({
    tree: Object,
    orgId: String,
    orchardId: String
})

const { tree, orgId, orchardId } = props

const { remainingText, remainingDays } = useRemainingTime(
    computed(() => tree?.wateredUntil ?? null)
)

</script>

<style scoped>
li {
    padding: 16px;
    border: 1px solid var(--vt-c-text-dark-2);
    ;
    margin-bottom: 8px;
}
</style>
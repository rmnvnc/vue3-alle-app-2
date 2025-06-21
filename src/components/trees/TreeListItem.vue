<template>
    <li :class="waterStatus">
        <router-link v-if="tree.slug && tree.id" :to="{
            name: 'tree-view',
            params: { orgId: orgId, orchardId: orchardId, treeId: tree.id, treeSlug: tree.slug }
        }">{{ tree.name }}
            <br>
            {{ remainingText }}
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

const waterStatus = computed(() => {
    let status = ''
    if (remainingDays.value > 12) {
        status = 'green';
    } else if (remainingDays.value > 7) {
        status = 'lightGreen'
    } else if (remainingDays.value > 1) {
        status = 'yellow'
    } else if (remainingDays.value > - 2) {
        status = 'orange'
    } else {
        status = 'red'
    }
    return status;
})

</script>

<style scoped>
li {
    padding: 16px;
    border: 1px solid var(--vt-c-text-dark-2);
    margin-bottom: 8px;
}

li.red {
    border-color: red;
    background-color: rgba(255, 0, 0, 0.1);
}

li.yellow {
    border-color: yellow;
    background-color: rgba(255, 255, 0, 0.1)
}

li.orange {
    border-color: orange;
    background-color: rgba(255, 166, 0, 0.1);
}

li.green {
    border-color: green;
    background-color: rgba(0, 128, 0, 0.1);
}

li.greenLight {
    border-color: rgb(0, 225, 0);
    background-color: rgba(0, 225, 0, 0.1);
}
</style>
<template>
    <main>
        <suspense>
            <template #default>
                <tree-content :tree-id="props.treeId" />
            </template>
            <template #fallback>
                <base-spinner>Načítavam strom…</base-spinner>
            </template>
        </suspense>
    </main>
</template>

<script setup lang="ts">
import TreeContent from '@/components/trees/TreeContent.vue';

interface Props {
    treeId: string
}
const props = defineProps<Props>()
</script>


<style scoped>
.add-tree,
h1 {
    margin-block: 16px;
}
</style>

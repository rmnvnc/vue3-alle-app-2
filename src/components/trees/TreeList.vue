<template>
    <transition-group name="tree" tag="ul">
        <tree-list-item v-for="tree in props.items" :key="tree.id" :tree="tree" />
    </transition-group>
</template>

<script setup lang="ts">
import TreeListItem from './TreeListItem.vue';
const props = defineProps({
    items: Object
})
</script>

<style scoped>
.tree-enter-from,
.tree-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}

.tree-enter-active,
.tree-leave-active {
    transition: all .5s ease;
}

ul {
    padding: unset;
    list-style: none;
    margin-top: 2rem;
}
</style>
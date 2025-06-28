<template>
    <button v-if="!link" :class="mode">
        <slot></slot>
    </button>
    <router-link v-else :to="to" :class="mode">
        <slot></slot>
    </router-link>
</template>

<script setup>
const props = defineProps({
    mode: {
        type: String,
        default: null
    },
    link: {
        type: Boolean,
        default: false
    },
    to: {
        type: String,
        default: '/'
    }
})
</script>

<style scoped>
button,
a {
    font-size: 16px;
    display: block;
    border: 2px solid var(--color-border);
    background-color: transparent;
    color: var(--color-text);
    padding: 8px 16px;
}

button:hover:not(:disabled),
a:hover:not(:disabled) {
    border-color: var(--color-border-hover);
    background-color: var(--color-background-mute);
    cursor: pointer;
}

button:disabled,
a:disabled {
    opacity: .6;
}
</style>
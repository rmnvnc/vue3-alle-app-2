<template>
    <button v-if="!link" :type="type" :disabled="disabled">
        <slot></slot>
    </button>
    <router-link v-else :to="to" :aria-disabled="disabled ? 'true' : undefined">
        <slot></slot>
    </router-link>
</template>

<script setup lang="ts">

interface Props {
    link?: boolean
    to?: string
    type?: 'button' | 'submit'
    disabled?: boolean
}

const { link = false, to = '/', type = 'button', disabled = false } = defineProps<Props>()
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
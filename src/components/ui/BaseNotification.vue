<template>
    <div class="notification" :class="type">
        <slot></slot>
    </div>
</template>

<script setup>
const props = defineProps({
    type: {
        type: String,
        default: 'info'
    }
})
</script>

<style scoped>
.notification {
    padding: 16px;
    border: 2px solid var(--color-border);
    margin-bottom: 1rem;
}

.info {
    background-color: var(--color-info);
}

.error {
    background-color: var(--color-error);
}

.success {
    background-color: var(--color-success);
}
</style>
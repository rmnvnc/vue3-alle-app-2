<template>
    <teleport to="body">
        <transition name="toast">
            <div v-if="visible" :class="['toast', `toast--${type}`]">
                <slot>{{ message }}</slot>
            </div>
        </transition>
    </teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    message: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'info'
    },
    duration: {
        type: Number,
        default: 5000
    }
})

const visible = ref(true)

onMounted(() => {
    setTimeout(() => {
        visible.value = false
    }, props.duration)
})
</script>

<style scoped>
.toast--success {
    background-color: var(--color-success);
}

.toast--info {
    background-color: var(--color-info);
}

.toast--error {
    background-color: var(--color-error);
}

.toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    /* rounded-md */
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    color: #fff;
    font-weight: 500;
    z-index: 1000;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease-out;
}

.toast-leave-active {
    transition: all 0.3s ease-in;
}

.toast-enter-to,
.toast-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>

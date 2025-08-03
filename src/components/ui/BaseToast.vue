<template>
    <teleport to="body">
        <transition name="toast">
            <div v-if="show" :class="['toast', `toast--${type}`]">
                <slot>{{ message }}</slot>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const { message, type, duration, show } = defineProps({
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
    },
    show: {
        type: Boolean,
        required: true
    },
})

const emit = defineEmits(['close'])


watch(() => show, (val) => {
    if (val) {
        setTimeout(() => {
            emit('close')
        }, duration)
    }
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
    padding: .5rem .75rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    color: #fff;
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

<template>
    <teleport to="body">
        <div v-if="show" @click="tryClose" class="backdrop"></div>
        <transition name="dialog">
            <dialog open v-if="show" class="dialog">

                <section class="dialog__header">
                    <slot name="header">
                        <h2>{{ title }}</h2>
                        <base-button v-if="!fixed" @click="tryClose" class="close"></base-button>
                    </slot>
                </section>
                <section class="dialog__body">
                    <slot></slot>
                </section>
            </dialog>
        </transition>
    </teleport>

</template>

<script setup>
const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        required: false
    },
    fixed: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close'])

function tryClose() {
    if (props.fixed) {
        return
    }
    emit('close')
}
</script>

<style scoped>
.backdrop {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    z-index: 10;
}

.dialog {
    color: var(--color-text);
    position: fixed;
    top: 20vh;
    width: 90%;
    z-index: 100;
    border: none;
    padding: 0;
    margin: auto;
    overflow: hidden;
    background-color: var(--color-background-soft);
    max-width: 700px;
}

@media (min-width: 1250px) {
    .dialog {
        width: 100%;
    }
}

.dialog__header {
    padding: 1rem 1rem 0;
    position: relative;
}

.dialog__body {
    padding: 1rem;
}

.close {
    right: 1rem;
    width: 2rem;
    height: 2rem;
    position: absolute;
    border: none;
    bottom: 0;
    background-color: unset;
}

.close:hover {
    background-color: unset;
}

.close:before,
.close:after {
    position: absolute;
    left: 15px;
    content: ' ';
    height: 32px;
    width: 2px;
    background-color: var(--color-text);
    top: 0;
}

.close:hover:before,
.close:hover:after {
    background-color: var(--vt-c-text-dark-1);
}



.close:before {
    transform: rotate(45deg);
}

.close:after {
    transform: rotate(-45deg);
}




menu {
    margin: 0;
    padding: 0;
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.dialog-enter-active {
    transition: all 0.3s ease-out;
}

.dialog-leave-active {
    transition: all 0.3s ease-in;
}

.dialog-enter-to,
.dialog-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>
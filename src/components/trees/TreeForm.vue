<template>
    <form @submit.prevent="submitForm">
        <base-notification v-if="!formLoading && formError" :type="{ 'error': formError }">
            {{ formError }}
        </base-notification>
        <div v-for="(field, key) in formSetup" :key="key" class="form-control" :class="{ invalid: !field.isValid }">
            <label :for="`field-${key}`"> {{ field.label }}</label>
            <p v-if="!field.isValid" class="invalid-message">{{ field.label }} je povinné pole</p>
            <input type="text" :id="`field-${key}`" v-model.trim="field.val" @blur="validateField(key)"
                :disabled="formLoading">
        </div>
        <base-button type="submit" :disabled="formLoading">
            {{ formLoading ? 'Odosielam...' : 'Odoslať' }}
        </base-button>
    </form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
    formLoading: Boolean,
    formError: String
})

const emit = defineEmits(['save-data'])

const isFormValid = computed(() =>
    Object.values(formSetup).every(f =>
        !f.isRequired || f.val !== ''
    )
)

const formSetup = reactive({
    treeName: {
        label: 'Názov stromu',
        val: '',
        isValid: true,
        isRequired: true
    },
    treeVariety: {
        label: 'Odroda stromu',
        val: '',
        isValid: true,
        isRequired: false
    },
    treeOwner: {
        label: 'Majiteľ stromu',
        val: '',
        isValid: true,
        isRequired: false
    }
})

function validateField(key) {
    const field = formSetup[key]

    if (field.isRequired && !field.val) {
        field.isValid = false;
    } else {
        field.isValid = true;
    }
}

function submitForm() {

    Object.keys(formSetup).forEach(validateField)

    if (!isFormValid.value) {
        return
    }

    const payload = Object.fromEntries(
        Object.entries(formSetup).map(([k, f]) => [k, f.val])
    )

    emit('save-data', payload)

}
</script>

<style scoped>
.form-control {
    margin-bottom: 1rem;
}

.invalid {
    color: red;
}

.invalid-message {
    font-size: 14px;
    margin-bottom: .5rem;
}

label {
    display: block;
    margin-bottom: .5rem;
}

input {
    display: block;
    width: 100%;
    border: 1px solid var(--color-border);
    background-color: transparent;
    color: var(--color-text);
    padding: 8px 12px;
}

input:focus {
    border-color: var(--color-border-hover);
}

button[type="submit"] {
    margin-top: 2rem;
}
</style>
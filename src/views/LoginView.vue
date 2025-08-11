<template>
    <form @submit.prevent="loginForm">
        <div class="form-control" v-if="error">
            <p class="error" role="alert">{{ error }}</p>
        </div>
        <div v-for="(field, key) in formSetup" :key="key" class="form-control" :class="{ invalid: !field.isValid }">
            <label :for="`field-${key}`"> {{ field.label }}</label>
            <p v-if="!field.isValid" :id="`err-${key}`" class="invalid-message">{{ field.label }} je povinné pole</p>
            <input :id="`field-${key}`" :name="`${key}`" v-model.trim="field.val" @blur="validateField(key)"
                :disabled="formLoading" :type="field.type" :required="field.isRequired" :aria-invalid="!field.isValid">
        </div>
        <base-button type="submit" :disabled="formLoading">
            {{ formLoading ? 'Prihlasujem...' : 'Prihlásiť' }}
        </base-button>
    </form>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { FIREBASE_ERROR_MESSAGES } from '@/utils/firebaseErrors'
import { FirebaseError } from 'firebase/app'

const auth = useAuthStore()

const formSetup = reactive({
    email: {
        label: 'E-mail',
        val: '',
        isValid: true,
        isRequired: true,
        type: 'email'
    },
    password: {
        label: 'Heslo',
        val: '',
        isValid: true,
        isRequired: true,
        type: 'password'
    }
})

const isFormValid = computed(() =>
    Object.values(formSetup).every(f =>
        !f.isRequired || f.val !== ''
    )
)

function validateField(key: keyof typeof formSetup) {
    const field = formSetup[key]

    if (field.isRequired && !field.val) {
        field.isValid = false;
    } else {
        field.isValid = true;
    }
}

const formLoading = ref(false)
const route = useRoute()
const router = useRouter()

const redirectPath = (route.query.redirect as string) || '/'
const error = ref('')

const loginForm = async () => {

    (Object.keys(formSetup) as (keyof typeof formSetup)[]).forEach(validateField)

    if (!isFormValid.value) {
        return
    }

    formLoading.value = true
    error.value = ''

    try {
        await auth.login(formSetup.email.val, formSetup.password.val)
        router.push(redirectPath)
    } catch (e) {
        const err = e as FirebaseError
        error.value = FIREBASE_ERROR_MESSAGES[err.code] || 'Nastala neznáma chyba, skúste sa prihlásiť neskôr'
    } finally {
        formLoading.value = false
    }

}

</script>

<style scoped>
form {
    margin-block: 2rem;
    max-width: 250px;
    margin-inline: auto;
}

.form-control {
    margin-bottom: 1rem;
}

.invalid,
.error {
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
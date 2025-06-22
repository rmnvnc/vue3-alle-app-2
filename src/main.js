import '@/assets/main.css'

import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/router'

import BaseButton from './components/ui/BaseButton.vue'
const BaseDialog = defineAsyncComponent(() => import('@/components/ui/BaseDialog.vue'))
const BaseSpinner = defineAsyncComponent(() => import('@/components/ui/BaseSpinner.vue'))
const BaseNotification = defineAsyncComponent(() => import('@/components/ui/BaseNotification.vue'))

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component('base-button', BaseButton)
app.component('base-dialog', BaseDialog)
app.component('base-spinner', BaseSpinner)
app.component('base-notification', BaseNotification)

app.mount('#app')

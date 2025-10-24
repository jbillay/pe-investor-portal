import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Vue from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import { usePluginContext, setPluginContextProviders } from '@/composables/usePluginContext'

// Expose Vue and Plugin Context to plugins via window object
declare global {
  interface Window {
    Vue: typeof Vue
    usePluginContext: typeof usePluginContext
    __toast: any
  }
}
window.Vue = Vue
window.usePluginContext = usePluginContext

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import Toolbar from 'primevue/toolbar'
import SplitButton from 'primevue/splitbutton'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'
import OverlayPanel from 'primevue/overlaypanel'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'

import 'primeicons/primeicons.css'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

// Register PrimeVue components globally
app.component('Button', Button)
app.component('InputText', InputText)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Select', Select)
app.component('MultiSelect', MultiSelect)
app.component('Card', Card)
app.component('Tag', Tag)
app.component('Badge', Badge)
app.component('Chip', Chip)
app.component('Toolbar', Toolbar)
app.component('SplitButton', SplitButton)
app.component('ProgressBar', ProgressBar)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Divider', Divider)
app.component('OverlayPanel', OverlayPanel)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)

// Register PrimeVue directives
app.directive('tooltip', Tooltip)

const mountedApp = app.mount('#app')

// Initialize plugin context providers
// Create a toast service wrapper that doesn't require inject
const toastService = {
  add: (options: any) => {
    // Use PrimeVue's toast event bus
    if (window.__toast) {
      window.__toast.add(options)
    } else {
      // Fallback to console if toast not available
      console.log(`[Toast ${options.severity}]:`, options.summary, options.detail)
    }
  },
  removeGroup: (group: string) => {
    if (window.__toast) {
      window.__toast.removeGroup(group)
    }
  },
  removeAllGroups: () => {
    if (window.__toast) {
      window.__toast.removeAllGroups()
    }
  }
}

setPluginContextProviders(router, toastService)

// Initialize authentication after app is mounted
;(async () => {
  const authStore = useAuthStore()
  // Initialize auth from localStorage
  authStore.initializeAuth()
})()

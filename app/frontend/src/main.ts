import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
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

import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue)
app.use(ToastService)
app.use(ConfirmationService)

// Register PrimeVue components globally
app.component('Button', Button)
app.component('InputText', InputText)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dropdown', Dropdown)
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

app.mount('#app')

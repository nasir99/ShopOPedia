import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/routes'
import { useThemeStore } from './stores/themeStore'
import { useAuthStore } from './stores/authStore'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/accessibility.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
const themeStore = useThemeStore(pinia)
themeStore.setTheme(themeStore.theme)
useAuthStore(pinia)
  .initializeAuth()
  .catch((err) => console.error('Failed to initialize authentication', err))

app.mount('#app')

<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom" aria-label="Main navigation">
    <div class="container-fluid">
     <img src ="../../assets/logo.png" style="width: 40px" class="mx-3" alt="" />
      <RouterLink class="navbar-brand p-2" :to="{ name: APP_ROUTE_NAMES.HOME }">
        Salena's Webshop
      </RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="mainNavigation"
        :aria-expanded="isNavigationOpen"
        aria-label="Toggle navigation"
        @click="isNavigationOpen = !isNavigationOpen"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="mainNavigation" class="collapse navbar-collapse" :class="{ show: isNavigationOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: APP_ROUTE_NAMES.HOME }" @click="isNavigationOpen = false">
              Home
            </RouterLink>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <RouterLink class="nav-link" :to="{ name: APP_ROUTE_NAMES.PRODUCT_LIST }" @click="isNavigationOpen = false">
              Product list
            </RouterLink>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <RouterLink class="nav-link" :to="{ name: APP_ROUTE_NAMES.PRODUCT_CREATE }" @click="isNavigationOpen = false">
             Add product
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: APP_ROUTE_NAMES.CONTACT_US }" @click="isNavigationOpen = false">
              Contact us
            </RouterLink>
          </li>
        </ul>
        <div class="d-flex gap-2">
        <ul class="d-flex navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item dropdown">
            <button
            class="nav-link dropdown-toggle"
            type="button"
            aria-label="Choose color theme"
            :aria-expanded="isThemeMenuOpen"
            @click="isThemeMenuOpen = !isThemeMenuOpen"
            >
            <i class="bi bi-laptop"></i>
            </button>
            <ul class="dropdown-menu" :class="{ show: isThemeMenuOpen }">
                <li><button @click="selectTheme('light')" class="dropdown-item" type="button">
                  <i class="bi bi-sun"></i> Light
                </button></li>
                <li><button @click="selectTheme('dark')" class="dropdown-item" type="button">
                  <i class="bi bi-moon-stars-fill"></i> Dark
                </button></li>
            </ul>
          </li>
        </ul>
          <template v-if="authStore.initialized && authStore.isAuthenticated">
            <button
              class="btn btn-outline-primary"
              type="button"
              :disabled="authStore.isLoading"
              @click="handleSignOut"
            >
              <span
                v-if="authStore.isLoading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              Sign out
            </button>
          </template>
          <template v-else-if="authStore.initialized">
          <RouterLink class="btn btn-outline-primary" :to="{ name: APP_ROUTE_NAMES.SIGN_IN }">
            Sign in
          </RouterLink>
          <RouterLink class="btn btn-primary" :to="{ name: APP_ROUTE_NAMES.SIGN_UP }">
            Sign up
          </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { APP_ROUTE_NAMES } from '@/constants/routeNames'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useSwal } from '@/composibles/useSwal'
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { showError } = useSwal()
const isNavigationOpen = ref(false)
const isThemeMenuOpen = ref(false)

const handleSignOut = async () => {
  try {
    await authStore.signOutUser()
    isNavigationOpen.value = false
  } catch (error) {
    console.error('Failed to sign out', error)
    await showError('Sign out failed. Please try again.')
  }
}

const selectTheme = (theme) => {
  themeStore.setTheme(theme)
  isThemeMenuOpen.value = false
}
</script>

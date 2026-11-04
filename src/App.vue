
<template>
<div class="d-flex flex-column min-vh-100">
  <a class="visually-hidden-focusable p-3" href="#main-content">Skip to main content</a>
  <Header />
  <main id="main-content" class="flex-grow-1" tabindex="-1">
    <RouterView />
  </main>
  <Footer />
  <ShopperPanel />
  <AiAssistantWidget />
</div>
</template>

<script setup>
import { watch } from 'vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import AiAssistantWidget from './components/Shop/AiAssistantWidget.vue'
import ShopperPanel from './components/Shop/ShopperPanel.vue'
import { useAuthStore } from './stores/authStore'
import { useShopperStore } from './stores/shopperStore'
import { RouterView } from 'vue-router'

const authStore = useAuthStore()
const shopperStore = useShopperStore()

watch(
  () => authStore.user,
  (user) => shopperStore.loadForUser(user),
  { immediate: true },
)
</script>
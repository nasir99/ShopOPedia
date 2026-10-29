
<template>
<div class="d-flex flex-column min-vh-100">
  <a class="visually-hidden-focusable p-3" href="#main-content">Skip to main content</a>
  <Header />
  <main id="main-content" class="flex-grow-1" tabindex="-1">
    <RouterView />
  </main>
  <Footer />
</div>
</template>

<script setup>
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import { RouterView } from 'vue-router'
</script>
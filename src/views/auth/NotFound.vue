<template>
  <section class="container py-5 text-center" aria-labelledby="not-found-title">
    <h1 id="not-found-title">Page not found</h1>
    <p>The page you requested could not be found.</p>
    <RouterLink :to="{ name: APP_ROUTE_NAMES.HOME }" class="btn btn-primary">
      Return to home
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { APP_ROUTE_NAMES } from '@/constants/routeNames.js'
</script>
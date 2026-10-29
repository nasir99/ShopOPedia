<template>
  <section class="container py-5 text-center" aria-labelledby="access-denied-title">
    <h1 id="access-denied-title">Access denied</h1>
    <p>You do not have permission to view this page.</p>
    <RouterLink :to="{ name: APP_ROUTE_NAMES.HOME }" class="btn btn-primary">
      Return to home
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { APP_ROUTE_NAMES } from '@/constants/routeNames.js'
</script>
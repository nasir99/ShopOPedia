<template>
  <section class="container py-4" aria-labelledby="orders-title">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
      <div>
        <h1 id="orders-title">Customer orders</h1>
        <p class="text-muted mb-0">Review submitted product order requests.</p>
      </div>
      <button class="btn btn-outline-primary mt-3 mt-md-0" type="button" :disabled="loading" @click="fetchOrders">
        Refresh orders
      </button>
    </div>

    <div v-if="loading" class="d-flex justify-content-center py-5" role="status" aria-live="polite">
      <div class="spinner-grow text-secondary" aria-hidden="true">
        <span class="visually-hidden">Loading customer orders…</span>
      </div>
    </div>
    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    <div v-else-if="orders.length === 0" class="alert alert-info" role="status">
      No customer orders have been submitted yet.
    </div>
    <div v-else class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <caption class="visually-hidden">Customer orders with product, quantity, contact, and delivery information</caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Product</th>
            <th scope="col">Quantity</th>
            <th scope="col">Customer</th>
            <th scope="col">Delivery address</th>
            <th scope="col">Submitted</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id">
            <td><code>{{ order.id }}</code></td>
            <td>
              <div class="fw-semibold">{{ order.product.name }}</div>
              <small class="text-muted">
                {{ order.product.category }} · ${{ order.product.unitPrice }} each
              </small>
            </td>
            <td>{{ order.quantity }}</td>
            <td>
              <div>{{ order.customer.name }}</div>
              <a :href="`mailto:${order.customer.email}`">{{ order.customer.email }}</a>
              <div>
                <a :href="`tel:${order.customer.phone}`">{{ order.customer.phone }}</a>
              </div>
            </td>
            <td>{{ order.customer.deliveryAddress }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td><span class="badge text-bg-secondary">{{ order.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <nav
        v-if="totalPages > 1"
        class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pb-3"
        aria-label="Order pages"
      >
        <p class="mb-0" aria-live="polite">
          Showing {{ (currentPage - 1) * pageSize + 1 }}–{{
            Math.min(currentPage * pageSize, orders.length)
          }}
          of {{ orders.length }} orders
        </p>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link"
              type="button"
              :disabled="currentPage === 1"
              aria-label="Previous order page"
              @click="currentPage--"
            >
              Previous
            </button>
          </li>
          <li
            v-for="page in totalPages"
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }"
          >
            <button
              class="page-link"
              type="button"
              :aria-label="`Order page ${page}`"
              :aria-current="currentPage === page ? 'page' : undefined"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link"
              type="button"
              :disabled="currentPage === totalPages"
              aria-label="Next order page"
              @click="currentPage++"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import orderService from '@/services/orderService'

const orders = ref([])
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)
const errorMessage = ref('')
const totalPages = computed(() => Math.ceil(orders.value.length / pageSize))
const paginatedOrders = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return orders.value.slice(startIndex, startIndex + pageSize)
})

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = Math.max(pageCount, 1)
  }
})

onMounted(fetchOrders)

async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    orders.value = await orderService.getOrders()
  } catch (error) {
    console.error('Failed to load customer orders', error)
    errorMessage.value = 'Customer orders could not be loaded. Please try again.'
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'Just now'
}
</script>

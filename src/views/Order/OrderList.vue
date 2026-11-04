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

    <div v-if="!loading && !errorMessage && orders.length" class="mb-3">
      <label for="order-search" class="form-label">Search orders</label>
      <input
        id="order-search"
        v-model.trim="searchQuery"
        class="form-control"
        type="search"
        placeholder="Search by order ID, product, customer, email, phone, or status"
      />
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
            <th scope="col">Products</th>
            <th scope="col">Items</th>
            <th scope="col">Payment</th>
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
              <ul class="list-unstyled mb-0">
                <li v-for="item in orderProducts(order)" :key="item.id">
                  <div class="fw-semibold">{{ item.name }}</div>
                  <small class="text-muted">
                    {{ item.category || 'Uncategorized' }} · {{ formatSEK(item.unitPrice) }} each
                    × {{ item.quantity }}
                  </small>
                </li>
              </ul>
            </td>
            <td>{{ orderProducts(order).reduce((sum, item) => sum + item.quantity, 0) }}</td>
            <td>
              <div>{{ order.paymentMethod === 'swish' ? 'Swish' : 'Not specified' }}</div>
              <small class="text-muted">{{ formatSEK(orderTotal(order)) }}</small>
            </td>
            <td>
              <div>{{ order.customer.name }}</div>
              <a :href="`mailto:${order.customer.email}`">{{ order.customer.email }}</a>
              <div>
                <a :href="`tel:${order.customer.phone}`">{{ order.customer.phone }}</a>
              </div>
            </td>
            <td>{{ order.customer.deliveryAddress }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <label class="visually-hidden" :for="`order-status-${order.id}`">
                Status for order {{ order.id }}
              </label>
              <select
                :id="`order-status-${order.id}`"
                class="form-select form-select-sm"
                :value="order.status"
                :disabled="updatingOrderIds.has(order.id)"
                :aria-label="`Status for order ${order.id}`"
                @change="updateOrderStatus(order, $event.target.value)"
              >
                <option v-for="status in ORDER_STATUSES" :key="status" :value="status">
                  {{ statusLabels[status] }}
                </option>
              </select>
              <span v-if="updatingOrderIds.has(order.id)" class="visually-hidden" role="status">
                Saving order status
              </span>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="8" class="text-center text-muted py-4">
              No orders match your search.
            </td>
          </tr>
        </tbody>
      </table>
      <nav
        v-if="filteredOrders.length > 0"
        class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pb-3"
        aria-label="Order pages"
      >
        <p class="mb-0" aria-live="polite">
          Showing {{ (currentPage - 1) * pageSize + 1 }}–{{
            Math.min(currentPage * pageSize, filteredOrders.length)
          }}
          of {{ filteredOrders.length }} orders (10 per page)
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
    <div v-if="statusError" class="alert alert-danger mt-3" role="alert">
      {{ statusError }}
    </div>
    <p v-if="statusMessage" class="visually-hidden" role="status" aria-live="polite">
      {{ statusMessage }}
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import orderService, { ORDER_STATUSES } from '@/services/orderService'

const orders = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10
const loading = ref(false)
const errorMessage = ref('')
const statusError = ref('')
const statusMessage = ref('')
const updatingOrderIds = ref(new Set())
const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const filteredOrders = computed(() => {
  const search = searchQuery.value.toLocaleLowerCase()
  if (!search) return orders.value

  return orders.value.filter((order) => {
    const customer = order.customer || {}
    const productDetails = orderProducts(order).flatMap((item) => [item.name, item.category])
    return [
      order.id,
      order.status,
      order.paymentMethod,
      customer.name,
      customer.email,
      customer.phone,
      customer.deliveryAddress,
      ...productDetails,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(search))
  })
})
const totalPages = computed(() => Math.ceil(filteredOrders.value.length / pageSize))
const paginatedOrders = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(startIndex, startIndex + pageSize)
})

watch(searchQuery, () => {
  currentPage.value = 1
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

async function updateOrderStatus(order, status) {
  const previousStatus = order.status
  statusError.value = ''
  statusMessage.value = ''
  order.status = status
  updatingOrderIds.value = new Set([...updatingOrderIds.value, order.id])

  try {
    await orderService.updateOrderStatus(order.id, status)
    statusMessage.value = `Order ${order.id} status updated to ${statusLabels[status]}.`
  } catch (error) {
    console.error(`Failed to update order ${order.id} status`, error)
    order.status = previousStatus
    statusError.value = `Status for order ${order.id} could not be updated. Please try again.`
  } finally {
    const remainingIds = new Set(updatingOrderIds.value)
    remainingIds.delete(order.id)
    updatingOrderIds.value = remainingIds
  }
}

function formatDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'Just now'
}

function formatSEK(amount) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  }).format(Number(amount) || 0)
}

function orderProducts(order) {
  if (Array.isArray(order.products)) return order.products
  return order.product
    ? [{ ...order.product, quantity: order.quantity || 1 }]
    : []
}

function orderTotal(order) {
  return orderProducts(order).reduce(
    (total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  )
}
</script>

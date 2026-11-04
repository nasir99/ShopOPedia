<template>
  <section class="container py-4" aria-labelledby="admin-insights-title">
    <header class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
      <div>
        <h1 id="admin-insights-title">Shop insights</h1>
        <p class="text-muted mb-0">Product reviews and best-selling products.</p>
      </div>
      <button class="btn btn-outline-primary mt-3 mt-md-0" type="button" :disabled="loading" @click="loadInsights">
        {{ loading ? 'Refreshing…' : 'Refresh insights' }}
      </button>
    </header>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>
    <div v-if="loading" class="d-flex justify-content-center py-5" role="status" aria-live="polite">
      <div class="spinner-grow text-secondary" aria-hidden="true">
        <span class="visually-hidden">Loading shop insights…</span>
      </div>
    </div>
    <template v-else>
      <section class="mb-5" aria-labelledby="best-sellers-title">
        <h2 id="best-sellers-title" class="h3">Best-selling products</h2>
        <p class="text-muted">Ranked by units in completed orders.</p>
        <div v-if="bestSellers.length" class="table-responsive">
          <table class="table table-striped table-hover align-middle">
            <caption class="visually-hidden">Products ranked by units sold in completed orders</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Units sold</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in bestSellers" :key="product.id">
                <td>{{ index + 1 }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.category || '—' }}</td>
                <td>{{ product.unitsSold }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="alert alert-info" role="status">No completed product sales yet.</p>
      </section>

      <section aria-labelledby="product-reviews-title">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h2 id="product-reviews-title" class="h3 mb-1">Product reviews</h2>
            <p class="text-muted mb-0">{{ reviews.length }} reviews across {{ products.length }} products.</p>
          </div>
          <label class="visually-hidden" for="review-product-filter">Filter reviews by product</label>
          <select id="review-product-filter" v-model="selectedProductId" class="form-select" style="max-width: 20rem">
            <option value="">All products</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>

        <div v-if="filteredReviews.length" class="list-group">
          <article v-for="review in paginatedReviews" :key="`${review.productId}-${review.id}`" class="list-group-item">
            <div class="d-flex flex-wrap justify-content-between gap-2">
              <h3 class="h6 mb-1">{{ review.productName }}</h3>
              <time class="small text-muted" :datetime="reviewDateISO(review.createdAt)">
                {{ formatDate(review.createdAt) }}
              </time>
            </div>
            <p class="mb-1"><span aria-label="Rating">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span> · {{ review.rating }}/5</p>
            <p class="mb-1">{{ review.body }}</p>
            <small class="text-muted">By {{ review.authorName || 'Customer' }}</small>
          </article>
        </div>
        <p v-else class="alert alert-info" role="status">
          {{ selectedProductId ? 'No reviews for this product yet.' : 'No product reviews yet.' }}
        </p>

        <nav v-if="totalReviewPages > 1" class="d-flex justify-content-between align-items-center mt-3" aria-label="Review pages">
          <p class="mb-0" aria-live="polite">
            Showing {{ (reviewPage - 1) * pageSize + 1 }}–{{ Math.min(reviewPage * pageSize, filteredReviews.length) }}
            of {{ filteredReviews.length }} reviews
          </p>
          <div class="btn-group">
            <button class="btn btn-outline-secondary" type="button" :disabled="reviewPage === 1" @click="reviewPage--">
              Previous
            </button>
            <button class="btn btn-outline-secondary" type="button" :disabled="reviewPage === totalReviewPages" @click="reviewPage++">
              Next
            </button>
          </div>
        </nav>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import orderService from '@/services/orderService'
import productService from '@/services/productService'
import reviewService from '@/services/reviewService'

const products = ref([])
const orders = ref([])
const reviews = ref([])
const loading = ref(false)
const errorMessage = ref('')
const selectedProductId = ref('')
const reviewPage = ref(1)
const pageSize = 10

const bestSellers = computed(() => {
  const soldByProduct = new Map()
  for (const order of orders.value) {
    if (order.status !== 'completed') continue
    const items = Array.isArray(order.products)
      ? order.products
      : order.product
        ? [{ ...order.product, quantity: order.quantity || 1 }]
        : []
    for (const item of items) {
      if (!item?.id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) continue
      soldByProduct.set(item.id, (soldByProduct.get(item.id) || 0) + Number(item.quantity))
    }
  }

  const productById = new Map(products.value.map((product) => [String(product.id), product]))
  return [...soldByProduct.entries()]
    .map(([id, unitsSold]) => {
      const product = productById.get(id)
      return {
        id,
        name: product?.name || 'Product no longer listed',
        category: product?.category || '',
        unitsSold,
      }
    })
    .sort((left, right) => right.unitsSold - left.unitsSold || left.name.localeCompare(right.name))
    .slice(0, 10)
})

const filteredReviews = computed(() =>
  selectedProductId.value
    ? reviews.value.filter((review) => review.productId === selectedProductId.value)
    : reviews.value,
)
const totalReviewPages = computed(() => Math.ceil(filteredReviews.value.length / pageSize))
const paginatedReviews = computed(() => {
  const start = (reviewPage.value - 1) * pageSize
  return filteredReviews.value.slice(start, start + pageSize)
})

watch([selectedProductId, totalReviewPages], () => {
  reviewPage.value = Math.min(reviewPage.value, Math.max(totalReviewPages.value, 1))
})

onMounted(loadInsights)

async function loadInsights() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [loadedProducts, loadedOrders] = await Promise.all([
      productService.getProducts(),
      orderService.getOrders(),
    ])
    products.value = loadedProducts
    orders.value = loadedOrders

    const productReviews = await Promise.all(
      loadedProducts.map(async (product) => ({
        product,
        reviews: await reviewService.getProductReviews(product.id),
      })),
    )
    reviews.value = productReviews
      .flatMap(({ product, reviews: productReviewList }) =>
        productReviewList.map((review) => ({
          ...review,
          productId: String(product.id),
          productName: product.name,
        })),
      )
      .sort((left, right) => timestampMillis(right.createdAt) - timestampMillis(left.createdAt))
    reviewPage.value = 1
  } catch (error) {
    console.error('Failed to load admin shop insights', error)
    errorMessage.value = 'Shop insights could not be loaded. Please try again.'
  } finally {
    loading.value = false
  }
}

function timestampMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0
}

function reviewDateISO(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null
  return date ? date.toISOString() : ''
}

function formatDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'Just now'
}
</script>

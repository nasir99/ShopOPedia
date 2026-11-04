<template>
  <div>
    <div
      class="bg-success w-100 position-relative overflow-hidden mb-4 py-5 d-flex align-items-center hero-section"
    >
      <div class="position-absolute top-0 start-0 w-100 h-100"></div>

      <div class="container-fluid position-relative z-1">
        <div class="row justify-content-center text-center">
          <div class="col-lg-8 col-xl-7">
            <h1 class="display-4 fw-bold text-white mb-4">
              Your One-Stop Clothes and shoes Shop
              <br class="d-none d-lg-block" />
             Guarantee for Quality and Every Style is available!
            </h1>
            <div class="input-group mt-3 mx-auto shadow-lg rounded-4" style="max-width: 700px">
              <input
                type="text"
                v-model="searchValue"
                class="form-control border-0 py-3 px-4 fs-5"
                placeholder="Search your favorite product..."
                aria-label="Search products by name"
                maxlength="300"
                @input="clearAiSearch"
              />
              <button
                class="btn btn-warning px-3"
                type="button"
                :disabled="aiSearchLoading || !searchValue.trim()"
                @click="runNaturalSearch"
              >
                {{ aiSearchLoading ? 'Searching…' : 'AI Search' }}
              </button>
            </div>
            <p class="small text-white mt-2 mb-0">
              Try: “Waterproof shoes under 1000 SEK” or “Winter jacket for a 10-year-old”.
            </p>
            <div class="mt-3 mx-auto text-start" style="max-width: 700px">
              <label for="visual-product-search" class="form-label text-white">
                Find similar products from an image
              </label>
              <input
                id="visual-product-search"
                class="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                :disabled="visualSearchLoading"
                @change="runVisualSearch"
              />
              <small class="form-text text-white">
                Images are analyzed by Azure OpenAI and are not saved as orders or product uploads.
              </small>
            </div>
            <p v-if="aiSearchError" class="alert alert-warning mt-3" role="alert">
              {{ aiSearchError }}
            </p>
            <p v-if="aiFilters.length" class="small text-white mt-2" aria-live="polite">
            AI matched:
            {{
              typeof aiFilters === 'object' && !Array.isArray(aiFilters)
                ? Object.entries(aiFilters)
                    .filter(([, value]) => value !== null && value !== '' && value !== false)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' · ')
                : aiFilters.join(' · ')
            }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div id="product-list" class="container">
      <h2 class="mb-5 text-center display-6">Discover Our Collection</h2>
      <section v-if="personalizedProducts.length" class="mb-5" aria-labelledby="recommendations-title">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h3 id="recommendations-title" class="h4 mb-0">Recommended for you</h3>
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
            :disabled="recommendationsLoading"
            @click="loadAIRecommendations()"
          >
            {{ recommendationsLoading ? 'Updating…' : 'Refresh AI recommendations' }}
          </button>
        </div>
        <p class="text-muted mt-2">
          Suggestions use products you viewed, saved, searched for, or added to your cart.
        </p>
        <p v-if="recommendationsError" class="small text-warning" role="status">
          AI recommendations are temporarily unavailable; showing related products instead.
        </p>
        <div class="row g-3">
          <ProductCard
            v-for="product in personalizedProducts"
            :key="`recommended-${product.id}`"
            :product="product"
            :review-stats="reviewStats[String(product.id)] || null"
            :review-stats-loading="reviewStatsLoading.has(String(product.id))"
            :review-stats-error="Boolean(reviewStatsErrors[String(product.id)])"
            @view-details="showProductDetails"
            @order="startProductOrder"
            @show-reviews="openReviewDialog"
          />
        </div>
      </section>

      <div class="row g-3 mb-4 align-items-center">
        <div class="col-md-auto">
          <div class="d-flex flex-wrap gap-3">
            <button
              @click="selectedCategory = category"
              v-for="(category, index) in categoryList"
              :key="index"
              class="btn px-4 py-2"
              type="button"
              :aria-pressed="category === selectedCategory"
              :class="{
                'btn-success text-white': category === selectedCategory,
                'btn-outline-success': category !== selectedCategory,
              }"
            >
              {{ category }}
            </button>
          </div>
        </div>
        <div class="col-md-auto ms-md-auto">
          <div class="dropdown">
            <button
              class="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 py-2"
              type="button"
              :aria-label="`Sort products: ${selectedSortOption}`"
              data-bs-toggle="dropdown"
            >
              <i class="bi bi-sort-down" aria-hidden="true"></i>
              <span class="text-capitalize">{{ selectedSortOption }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li v-for="(sort, index) in SORT_OPTIONS" :key="index">
                <button
                  class="dropdown-item py-2 d-flex align-items-center gap-2"
                  @click="selectedSortOption = sort"
                >
                  <i class="bi"></i>
                  <span class="text-capitalize"> {{ sort }} </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div
          v-if="loading"
          class="d-flex justify-content-center align-items-center py-5"
          role="status"
          aria-live="polite"
        >
          <div class="spinner-grow text-secondary" aria-hidden="true">
            <span class="visually-hidden">Loading products…</span>
          </div>
        </div>
        <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <div v-else-if="filteredProductList.length > 0" class="row g-4 pb-4">
          <ProductCard
            v-for="product in paginatedProductList"
            :key="product.id"
            :product="product"
            :review-stats="reviewStats[String(product.id)] || null"
            :review-stats-loading="reviewStatsLoading.has(String(product.id))"
            :review-stats-error="Boolean(reviewStatsErrors[String(product.id)])"
            @view-details="showProductDetails"
            @order="startProductOrder"
            @show-reviews="openReviewDialog"
          ></ProductCard>
        </div>
        <div v-else role="status" aria-live="polite">
          <p class="h3 text-center">No products found.</p>
        </div>
        <nav
          v-if="totalPages > 1"
          class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pb-4"
          aria-label="Product pages"
        >
          <p class="mb-0" aria-live="polite">
            Showing {{ (currentPage - 1) * pageSize + 1 }}–{{
              Math.min(currentPage * pageSize, filteredProductList.length)
            }}
            of {{ filteredProductList.length }} products
          </p>
          <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button
                class="page-link"
                type="button"
                :disabled="currentPage === 1"
                aria-label="Previous product page"
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
                :aria-label="`Product page ${page}`"
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
                aria-label="Next product page"
                @click="currentPage++"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <dialog
      ref="productDetailsDialog"
      class="product-details-dialog"
      aria-labelledby="product-details-title"
      @close="onProductDetailsClose"
      @click.self="closeProductDetails"
    >
      <article v-if="selectedProduct" class="card border-0">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h2 id="product-details-title" class="h4 mb-0">{{ selectedProduct.name }}</h2>
          <button
            class="btn-close"
            type="button"
            aria-label="Close product details"
            @click="closeProductDetails"
          ></button>
        </div>
        <div class="card-body">
          <img
            :src="selectedProduct.image || 'https://placehold.co/600x400?text=Product'"
            class="img-fluid rounded mb-3 product-details-image"
            :alt="selectedProduct.name"
          />
          <p class="text-muted mb-2">{{ selectedProduct.category }}</p>
          <p>{{ selectedProduct.description || 'No description available.' }}</p>
          <p v-if="selectedProduct.isBestSeller">
            <span class="badge text-bg-warning">Bestseller</span>
          </p>
          <div class="d-flex align-items-baseline gap-2 mb-3">
            <span class="fw-semibold fs-5">
              {{ formatSEK(selectedProduct.salePrice || selectedProduct.price) }}
            </span>
            <del v-if="selectedProduct.salePrice" class="text-muted">
              {{ formatSEK(selectedProduct.price) }}
            </del>
          </div>
          <div v-if="selectedProduct.tags?.length">
            <h3 class="h6">Tags</h3>
            <ul class="list-inline mb-0">
              <li v-for="tag in selectedProduct.tags" :key="tag" class="list-inline-item">
                <span class="badge text-bg-secondary">{{ tag }}</span>
              </li>
            </ul>
          </div>
          <section v-if="similarProducts.length" class="border-top mt-4 pt-3" aria-labelledby="similar-products-title">
            <h3 id="similar-products-title" class="h6">Similar products</h3>
            <ul class="list-group">
              <li
                v-for="product in similarProducts"
                :key="product.id"
                class="list-group-item d-flex justify-content-between align-items-center gap-2"
              >
                <span>{{ product.name }} · {{ formatSEK(product.salePrice || product.price) }}</span>
                <button class="btn btn-sm btn-outline-success" type="button" @click="shopperStore.addToCart(product)">
                  Add to cart
                </button>
              </li>
            </ul>
          </section>
          <section
            v-for="section in additionalRecommendationSections"
            :key="section.key"
            class="border-top mt-3 pt-3"
            :aria-labelledby="`${section.key}-title`"
          >
            <h3 :id="`${section.key}-title`" class="h6">{{ section.title }}</h3>
            <ul class="list-group">
              <li
                v-for="product in section.products"
                :key="product.id"
                class="list-group-item d-flex justify-content-between align-items-center gap-2"
              >
                <span>{{ product.name }} · {{ formatSEK(product.salePrice || product.price) }}</span>
                <button class="btn btn-sm btn-outline-success" type="button" @click="shopperStore.addToCart(product)">
                  Add to cart
                </button>
              </li>
            </ul>
          </section>
          <p v-if="recommendationsLoading" class="small text-muted mt-2" role="status">
            Loading personalized suggestions…
          </p>
          <p v-if="recommendationsError" class="alert alert-warning mt-2" role="status">
            {{ recommendationsError }}
          </p>
          <section class="border-top mt-4 pt-3" aria-labelledby="reviews-title">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <h3 id="reviews-title" class="h6 mb-0">Customer reviews</h3>
              <button
                class="btn btn-sm btn-outline-primary"
                type="button"
                :disabled="reviewSummaryLoading || !productReviews.length"
                @click="summarizeReviews"
              >
                {{ reviewSummaryLoading ? 'Summarizing…' : 'AI review summary' }}
              </button>
            </div>
            <p v-if="reviewError" class="alert alert-danger mt-2" role="alert">{{ reviewError }}</p>
            <div v-if="reviewSummary" class="alert alert-info mt-2">
              <p class="mb-1">{{ reviewSummary.summary }}</p>
              <p v-if="reviewSummary.pros?.length" class="mb-1">
                <strong>Customers like:</strong> {{ reviewSummary.pros.join(', ') }}
              </p>
              <p v-if="reviewSummary.cons?.length" class="mb-1">
                <strong>Consider:</strong> {{ reviewSummary.cons.join(', ') }}
              </p>
              <small>Based on {{ reviewSummary.reviewCount }} reviews.</small>
            </div>
            <div v-if="reviewsLoading" class="small text-muted" role="status">Loading reviews…</div>
            <ul v-else-if="productReviews.length" class="list-group list-group-flush mt-2">
              <li v-for="review in productReviews" :key="review.id" class="list-group-item px-0">
                <strong>{{ review.authorName }}</strong>
                <span class="ms-2" :aria-label="`${review.rating} out of 5 stars`">
                  {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                </span>
                <p class="mb-0">{{ review.body }}</p>
              </li>
            </ul>
            <p v-else-if="!reviewsLoading" class="text-muted mt-2">No reviews yet.</p>
            <form v-if="authStore.isAuthenticated" class="mt-3" @submit.prevent="submitReview">
              <label for="review-rating" class="form-label">Your rating</label>
              <select id="review-rating" v-model.number="reviewForm.rating" class="form-select mb-2" required>
                <option v-for="rating in [5, 4, 3, 2, 1]" :key="rating" :value="rating">
                  {{ rating }} out of 5
                </option>
              </select>
              <label for="review-body" class="form-label">Your review</label>
              <textarea
                id="review-body"
                v-model.trim="reviewForm.body"
                class="form-control"
                minlength="10"
                maxlength="2000"
                rows="3"
                required
              ></textarea>
              <button class="btn btn-outline-primary btn-sm mt-2" type="submit" :disabled="reviewSubmitting">
                {{ reviewSubmitting ? 'Submitting…' : 'Submit review' }}
              </button>
            </form>
            <p v-else class="small mt-3">
              <router-link :to="`/sign-in?redirect=${encodeURIComponent('/')}`">Sign in</router-link>
              to submit a review.
            </p>
          </section>
          <div class="mt-4">
            <button
              v-if="!showOrderForm"
              class="btn btn-primary"
              type="button"
              @click="startCurrentProductOrder"
            >
              Order this item
            </button>
          </div>
          <form
            v-if="showOrderForm"
            class="border-top mt-4 pt-4"
            aria-labelledby="order-form-title"
            @submit.prevent="submitOrder"
          >
            <h3 id="order-form-title" class="h5">Your order details</h3>
            <p class="small text-muted">
              Submit your request to save it for the shop admin, then pay using Swish and email
              the order details.
            </p>
            <ul v-if="orderLineItems.length" class="list-group mb-3">
              <li
                v-for="item in orderLineItems"
                :key="item.id"
                class="list-group-item d-flex justify-content-between gap-3"
              >
                <span>{{ item.name }} × {{ item.quantity }}</span>
                <span>{{ formatSEK(item.unitPrice * item.quantity) }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between fw-semibold">
                <span>Order total</span>
                <span>{{ formatSEK(orderTotal) }}</span>
              </li>
            </ul>
            <div v-if="orderError" class="alert alert-danger" role="alert">
              {{ orderError }}
            </div>
            <div v-if="savedOrderId" class="alert" :class="emailConfirmed ? 'alert-success' : 'alert-info'" role="status">
              <strong v-if="emailConfirmed">Your order has been submitted successfully!</strong>
              <strong v-else>Your order request is saved. Send the email to complete your submission.</strong>
              <p class="mb-0">Your order reference is {{ savedOrderId }}.</p>
              <hr />
              <h4 class="h6">Pay by Swish</h4>
              <p class="mb-1">Recipient: <strong>{{ swishNumber }}</strong></p>
              <p class="mb-1">Amount: <strong>{{ formatSEK(orderTotal) }}</strong></p>
              <p class="mb-1">Message/reference: <strong>{{ savedOrderId }}</strong></p>
              <p class="small mb-0">
                Open the Swish app and enter these details. Payment is not automatically
                verified; the shop will confirm it separately.
              </p>
            </div>
            <div class="mb-3">
              <label for="order-customer-name" class="form-label">Your name</label>
              <input
                id="order-customer-name"
                v-model.trim="orderForm.name"
                class="form-control"
                autocomplete="name"
                :disabled="savingOrder || Boolean(savedOrderId)"
                required
              />
            </div>
            <div class="mb-3">
              <label for="order-customer-email" class="form-label">Email address</label>
              <input
                id="order-customer-email"
                v-model.trim="orderForm.email"
                class="form-control"
                type="email"
                autocomplete="email"
                :disabled="savingOrder || Boolean(savedOrderId)"
                required
              />
            </div>
            <div class="mb-3">
              <label for="order-customer-phone" class="form-label">Phone number</label>
              <input
                id="order-customer-phone"
                v-model.trim="orderForm.phone"
                class="form-control"
                type="tel"
                autocomplete="tel"
                :disabled="savingOrder || Boolean(savedOrderId)"
                required
              />
            </div>
            <div class="mb-3">
              <label for="order-customer-address" class="form-label">Delivery address</label>
              <textarea
                id="order-customer-address"
                v-model.trim="orderForm.deliveryAddress"
                class="form-control"
                autocomplete="street-address"
                rows="3"
                :disabled="savingOrder || Boolean(savedOrderId)"
                required
              ></textarea>
            </div>
            <div v-if="!isCartCheckout" class="mb-3">
              <label for="order-quantity" class="form-label">Quantity</label>
              <input
                id="order-quantity"
                v-model.number="orderForm.quantity"
                class="form-control"
                type="number"
                min="1"
                step="1"
                :disabled="savingOrder || Boolean(savedOrderId)"
                required
              />
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-if="!savedOrderId"
                class="btn btn-primary"
                type="submit"
                :disabled="savingOrder || cartCheckoutInvalid"
              >
                <span v-if="savingOrder" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                {{ savingOrder ? 'Saving order…' : 'Save order and prepare email' }}
              </button>
              <template v-if="orderMailto">
                <a
                  class="btn btn-success"
                  :href="orderGmailUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Gmail to send order
                </a>
                <a class="btn btn-outline-success" :href="orderMailto">
                  Use default email app
                </a>
                <button
                  v-if="!emailConfirmed"
                  class="btn btn-outline-primary"
                  type="button"
                  @click="confirmOrderEmailSent"
                >
                  I’ve sent the email
                </button>
              </template>
            </div>
          </form>
        </div>
      </article>
    </dialog>

    <dialog
      ref="reviewDialog"
      class="product-details-dialog review-dialog"
      aria-labelledby="review-dialog-title"
      @click.self="reviewDialog?.close()"
    >
      <section>
        <header class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2 id="review-dialog-title" class="h4 mb-0">
              Reviews for {{ reviewDialogProduct?.name }}
            </h2>
            <p v-if="reviewStats[String(reviewDialogProduct?.id)]" class="small text-muted mb-0 mt-1">
              ★ {{ reviewStats[String(reviewDialogProduct?.id)].average.toFixed(1) }}/5 ·
              {{ reviewStats[String(reviewDialogProduct?.id)].total }}
              {{ reviewStats[String(reviewDialogProduct?.id)].total === 1 ? 'review' : 'reviews' }}
            </p>
          </div>
          <button
            class="btn-close"
            type="button"
            aria-label="Close reviews"
            @click="reviewDialog?.close()"
          ></button>
        </header>
        <div class="card-body">
          <p v-if="reviewDialogLoading" class="text-muted" role="status">Loading reviews…</p>
          <p v-else-if="reviewDialogError" class="alert alert-danger" role="alert">
            {{ reviewDialogError }}
          </p>
          <p v-else-if="!reviewDialogReviews.length" class="text-muted">No reviews yet.</p>
          <ul v-else class="list-group list-group-flush">
            <li
              v-for="review in reviewDialogReviews"
              :key="review.id"
              class="list-group-item px-0"
            >
              <div class="d-flex justify-content-between gap-2">
                <strong>{{ review.authorName || 'Customer' }}</strong>
                <span :aria-label="`${review.rating} out of 5 stars`">
                  {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                </span>
              </div>
              <p class="mb-0 mt-1">{{ review.body }}</p>
            </li>
          </ul>
          <p v-if="!reviewDialogLoading && !reviewDialogError && reviewDialogReviews.length >= 50" class="small text-muted mt-2 mb-0">
            Showing the 50 most recent reviews.
          </p>
        </div>
      </section>
    </dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import productService from '@/services/productService'
import orderService from '@/services/orderService'
import aiService from '@/services/aiService'
import reviewService from '@/services/reviewService'
import { useSwal } from '@/composibles/useSwal'
import { auth } from '@/utility/firebaseConfig'
import { useShopperStore } from '@/stores/shopperStore'
import { useAuthStore } from '@/stores/authStore'
import ProductCard from '@/components/Product/ProductCard.vue'
import {
  PRODUCT_CATEGORIES,
  SORT_NAME_A_Z,
  SORT_NAME_Z_A,
  SORT_OPTIONS,
  SORT_PRICE_HIGH_LOW,
  SORT_PRICE_LOW_HIGH,
} from '@/constants/appConstants'
const products = ref([])
const loading = ref(false)
const errorMessage = ref('')
const aiSearchLoading = ref(false)
const visualSearchLoading = ref(false)
const aiSearchError = ref('')
const aiRankedIds = ref([])
const hasAiRanking = ref(false)
const aiFilters = ref([])
const searchValue = ref('')
const selectedSortOption = ref(SORT_OPTIONS[0])
const selectedCategory = ref('ALL')
const currentPage = ref(1)
const pageSize = 8
const categoryList = ref(['ALL', ...PRODUCT_CATEGORIES])
const selectedProduct = ref(null)
const productDetailsDialog = ref(null)
const reviewDialog = ref(null)
const reviewDialogProduct = ref(null)
const reviewDialogReviews = ref([])
const reviewDialogLoading = ref(false)
const reviewDialogError = ref('')
let reviewDialogRequestId = 0
const showOrderForm = ref(false)
const selectedOrderItems = ref([])
const isCartCheckout = ref(false)
const cartCheckoutInvalid = ref(false)
const orderMailto = ref('')
const orderGmailUrl = ref('')
const savingOrder = ref(false)
const savedOrderId = ref('')
const emailConfirmed = ref(false)
const orderError = ref('')
const productReviews = ref([])
const reviewStats = ref({})
const reviewStatsErrors = ref({})
const reviewStatsLoading = ref(new Set())
const reviewsLoading = ref(false)
const reviewSubmitting = ref(false)
const reviewSummaryLoading = ref(false)
const reviewError = ref('')
const reviewSummary = ref(null)
const reviewForm = reactive({ rating: 5, body: '' })
const recommendationGroups = ref({
  recommendedForYou: [],
  similarProducts: [],
  customersAlsoBought: [],
  frequentlyBoughtTogether: [],
})
const recommendationsError = ref('')
const recommendationsLoading = ref(false)
let previousPageMetadata = null
let recommendationRequestId = 0
let aiSearchRequestId = 0
const shopperStore = useShopperStore()
const authStore = useAuthStore()
const { showSuccess } = useSwal()
const route = useRoute()
const router = useRouter()
const swishNumber = '+46 702530515'
const orderForm = reactive({
  name: '',
  email: '',
  phone: '',
  deliveryAddress: '',
  quantity: 1,
})
const orderLineItems = computed(() =>
  selectedOrderItems.value.map((item) => ({
    ...item,
    quantity: isCartCheckout.value ? item.quantity : orderForm.quantity,
  })),
)
const orderTotal = computed(() =>
  orderLineItems.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
)
const orderEmail = 'nasir9973@gmail.com'
onMounted(() => {
  fetchProducts()
})

const showProductDetails = async (product) => {
  selectedProduct.value = product
  shopperStore.trackView(product)
  productReviews.value = []
  reviewSummary.value = null
  reviewError.value = ''
  reviewForm.rating = 5
  reviewForm.body = ''
  showOrderForm.value = false
  selectedOrderItems.value = []
  isCartCheckout.value = false
  cartCheckoutInvalid.value = false
  orderMailto.value = ''
  orderGmailUrl.value = ''
  savedOrderId.value = ''
  emailConfirmed.value = false
  orderError.value = ''
  Object.assign(orderForm, {
    name: '',
    email: '',
    phone: '',
    deliveryAddress: '',
    quantity: 1,
  })
  await nextTick()
  productDetailsDialog.value?.showModal()
  addProductStructuredData(product)
  loadAIRecommendations(String(product.id))
  loadReviews(product.id)
}

const startProductOrder = async (product, quantity = 1) => {
  await showProductDetails(product)
  showOrderForm.value = true
  orderForm.quantity = Math.min(99, Math.max(1, Number(quantity) || 1))
  selectedOrderItems.value = [toOrderLine(product, orderForm.quantity)]
}

function startCurrentProductOrder() {
  if (!selectedProduct.value) return
  showOrderForm.value = true
  isCartCheckout.value = false
  selectedOrderItems.value = [
    toOrderLine(selectedProduct.value, Math.min(99, Math.max(1, Number(orderForm.quantity) || 1))),
  ]
}

function toOrderLine(product, quantity) {
  return {
    id: String(product.id ?? ''),
    name: product.name,
    category: product.category || '',
    unitPrice: Number(product.salePrice || product.price),
    quantity,
  }
}

async function startCartOrder() {
  const cartItems = shopperStore.cart
  if (!cartItems.length) return

  const productsById = new Map(products.value.map((product) => [String(product.id), product]))
  const orderLines = cartItems
    .map((item) => {
      const product = productsById.get(String(item.id))
      return product ? toOrderLine(product, item.quantity) : null
    })
    .filter(Boolean)

  if (!orderLines.length) {
    errorMessage.value = 'The products in your bag are unavailable. Please refresh and try again.'
    return
  }
  await showProductDetails(productsById.get(orderLines[0].id))
  isCartCheckout.value = true
  showOrderForm.value = true
  selectedOrderItems.value = orderLines
  cartCheckoutInvalid.value = orderLines.length !== cartItems.length
  if (cartCheckoutInvalid.value) {
    orderError.value =
      'Some items in your bag are no longer available. Remove unavailable items before submitting this order.'
  }
}

function beginCartCheckoutFromRoute() {
  if (route.query.checkout !== 'cart') return false
  router.replace({ query: { ...route.query, checkout: undefined, quantity: undefined } })
  startCartOrder()
  return true
}

const closeProductDetails = () => {
  productDetailsDialog.value?.close()
}

async function openReviewDialog(product) {
  reviewDialogProduct.value = product
  reviewDialogReviews.value = []
  reviewDialogError.value = ''
  reviewDialogLoading.value = true
  const requestId = ++reviewDialogRequestId
  reviewDialog.value?.showModal()

  try {
    const reviews = await reviewService.getProductReviews(product.id)
    if (requestId === reviewDialogRequestId) reviewDialogReviews.value = reviews
  } catch (error) {
    console.error(`Failed to load reviews for product ${product.id}`, error)
    if (requestId === reviewDialogRequestId) {
      reviewDialogError.value = 'Reviews could not be loaded. Please try again.'
    }
  } finally {
    if (requestId === reviewDialogRequestId) reviewDialogLoading.value = false
  }
}

const onProductDetailsClose = () => {
  removeProductStructuredData()
  selectedProduct.value = null
}

function confirmOrderEmailSent() {
  if (!savedOrderId.value || !orderMailto.value) return
  emailConfirmed.value = true
  closeProductDetails()
  showSuccess(
    "Your order has been submitted successfully. Thanks for visiting Salena's webshop!",
    5000,
  )
}

const formatSEK = (amount) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(
    Number(amount) || 0,
  )

const submitOrder = async () => {
  if (
    !selectedProduct.value ||
    !selectedOrderItems.value.length ||
    cartCheckoutInvalid.value ||
    savingOrder.value ||
    savedOrderId.value ||
    (!isCartCheckout.value &&
      (!Number.isInteger(orderForm.quantity) || orderForm.quantity < 1 || orderForm.quantity > 99))
  ) return

  savingOrder.value = true
  orderError.value = ''

  try {
    const productsToOrder = orderLineItems.value.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    }))
    const orderId = await orderService.createOrder({
      customer: {
        name: orderForm.name,
        email: orderForm.email,
        phone: orderForm.phone,
        deliveryAddress: orderForm.deliveryAddress,
        userId: auth.currentUser?.uid ?? null,
      },
      products: productsToOrder,
      totalAmount: orderTotal.value,
      paymentMethod: 'swish',
    })

    savedOrderId.value = orderId
    if (isCartCheckout.value) shopperStore.clearCart()
    const subject = `Order request (${orderId})`
    const body = [
      'New order request',
      `Order reference: ${orderId}`,
      '',
      'Products:',
      ...productsToOrder.flatMap((item) => [
        `- ${item.name}`,
        `  Category: ${item.category || 'Not specified'}`,
        `  Quantity: ${item.quantity}`,
        `  Unit price: ${formatSEK(item.unitPrice)}`,
        `  Line total: ${formatSEK(item.unitPrice * item.quantity)}`,
      ]),
      `Order total: ${formatSEK(orderTotal.value)}`,
      'Payment method: Swish',
      `Swish recipient: ${swishNumber}`,
      `Swish payment reference: ${orderId}`,
      '',
      'Customer details',
      `Name: ${orderForm.name}`,
      `Email: ${orderForm.email}`,
      `Phone: ${orderForm.phone}`,
      `Delivery address: ${orderForm.deliveryAddress}`,
    ].join('\n')

    orderMailto.value =
      `mailto:${orderEmail}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`

    const gmailParams = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: orderEmail,
      su: subject,
      body,
    })
    orderGmailUrl.value = `https://mail.google.com/mail/?${gmailParams.toString()}`
  } catch (error) {
    console.error('Failed to save customer order', error)
    orderError.value = 'Your order could not be saved. Please try again.'
  } finally {
    savingOrder.value = false
  }
}

const fetchProducts = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    products.value = await productService.getProducts()
    handleCheckoutQuery()
    loadAIRecommendations()
  } catch (err) {
    console.error('Failed to load products for the home page', err)
    errorMessage.value = 'Products could not be loaded. Please try again later.'
  } finally {
    loading.value = false
  }
}

function handleCheckoutQuery() {
  if (beginCartCheckoutFromRoute()) return
  const productId = String(route.query.checkout || '')
  if (!productId) return
  const product = products.value.find((item) => String(item.id) === productId)
  if (!product) return
  const requestedQuantity = Number(route.query.quantity)
  const quantity =
    Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= 99
      ? requestedQuantity
      : 1
  router.replace({ query: { ...route.query, checkout: undefined, quantity: undefined } })
  startProductOrder(product, quantity)
}

const personalizedProducts = computed(() => {
  const recommendedIds = recommendationGroups.value.recommendedForYou
  if (recommendedIds.length) {
    const productsById = new Map(products.value.map((product) => [String(product.id), product]))
    return recommendedIds.map((id) => productsById.get(String(id))).filter(Boolean).slice(0, 4)
  }

  const profile = [
    ...shopperStore.viewedProducts,
    ...shopperStore.wishlist,
    ...shopperStore.cart,
    ...shopperStore.purchaseHistory,
  ]
  if (!profile.length) return []

  const categoryCounts = new Map()
  profile.forEach((item) => {
    if (item.category) {
      const category = String(item.category).toLowerCase()
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
    }
  })
  const interactedIds = new Set(profile.map((item) => String(item.id)))
  return products.value
    .filter((product) => !interactedIds.has(String(product.id)))
    .map((product) => ({
      product,
      score: categoryCounts.get(String(product.category || '').toLowerCase()) || 0,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.product)
})

const filteredProductList = computed(() => {
  let tempArray = [...products.value]

  if (selectedCategory.value !== 'ALL') {
    tempArray = tempArray.filter(
      (item) => item.category.toUpperCase() === selectedCategory.value.toUpperCase(),
    )
  }

  if (hasAiRanking.value) {
    const productsById = new Map(tempArray.map((product) => [String(product.id), product]))
    tempArray = aiRankedIds.value
      .map((id) => productsById.get(String(id)))
      .filter(Boolean)
  } else if (searchValue.value) {
    tempArray = tempArray.filter((item) => {
      return item.name.toUpperCase().includes(searchValue.value.toUpperCase())
    })
  }

  if (!hasAiRanking.value && selectedSortOption.value === SORT_NAME_A_Z) {
    tempArray.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (!hasAiRanking.value && selectedSortOption.value === SORT_NAME_Z_A) {
    tempArray.sort((a, b) => b.name.localeCompare(a.name))
  }
  if (!hasAiRanking.value && selectedSortOption.value === SORT_PRICE_HIGH_LOW) {
    tempArray.sort((a, b) => b.price - a.price)
  }
  if (!hasAiRanking.value && selectedSortOption.value === SORT_PRICE_LOW_HIGH) {
    tempArray.sort((a, b) => a.price - b.price)
  }
  if (hasAiRanking.value && aiFilters.value?.sortBy === 'price_asc') {
    tempArray.sort(
      (a, b) =>
        Number(a.salePrice || a.price) - Number(b.salePrice || b.price),
    )
  }
  if (hasAiRanking.value && aiFilters.value?.sortBy === 'price_desc') {
    tempArray.sort(
      (a, b) =>
        Number(b.salePrice || b.price) - Number(a.salePrice || a.price),
    )
  }

  return tempArray
})

async function runNaturalSearch() {
  const query = searchValue.value.trim()
  if (!query || aiSearchLoading.value) return

  aiSearchLoading.value = true
  aiSearchError.value = ''
  const requestId = ++aiSearchRequestId
  try {
    shopperStore.trackSearch(query)
    const result = await aiService.searchProducts(
      query,
      products.value.slice(0, 40).map(toAIProduct),
    )
    if (requestId !== aiSearchRequestId) return
    aiRankedIds.value = Array.isArray(result.rankedProductIds) ? result.rankedProductIds : []
    aiFilters.value = result.filters || {}
    hasAiRanking.value = true
    currentPage.value = 1
  } catch (error) {
    console.error('AI product search failed', error)
    if (requestId === aiSearchRequestId) {
      aiSearchError.value =
        'AI search is unavailable. Try a shorter search or use standard search.'
      hasAiRanking.value = false
    }
  } finally {
    if (requestId === aiSearchRequestId) aiSearchLoading.value = false
  }
}

function clearAiSearch() {
  aiSearchRequestId += 1
  aiSearchLoading.value = false
  hasAiRanking.value = false
  aiRankedIds.value = []
  aiFilters.value = []
  aiSearchError.value = ''
}

async function runVisualSearch(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  aiSearchError.value = ''

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
    aiSearchError.value = 'Choose a JPEG, PNG, or WebP image no larger than 3 MB.'
    input.value = ''
    return
  }

  visualSearchLoading.value = true
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('The image could not be read.'))
      reader.readAsDataURL(file)
    })
    const imageBase64 = String(dataUrl).split(',')[1]
    const result = await aiService.visualSearch(
      imageBase64,
      file.type,
      products.value.slice(0, 40).map(toAIProduct),
    )
    aiRankedIds.value = Array.isArray(result.rankedProductIds) ? result.rankedProductIds : []
    aiFilters.value = result.attributes || {}
    hasAiRanking.value = true
    searchValue.value = ''
    currentPage.value = 1
  } catch (error) {
    console.error('AI visual product search failed', error)
    aiSearchError.value = 'Visual search is unavailable. Please try another image.'
  } finally {
    visualSearchLoading.value = false
    input.value = ''
  }
}

function toAIProduct(product) {
  return {
    id: String(product.id),
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    price: Number(product.price || 0),
    salePrice: product.salePrice == null ? null : Number(product.salePrice),
    tags: Array.isArray(product.tags) ? product.tags.slice(0, 12) : [],
  }
}

const similarProducts = computed(() => {
  if (!selectedProduct.value) return []
  const recommendedIds = recommendationGroups.value.similarProducts
  if (recommendedIds.length) {
    const productsById = new Map(products.value.map((product) => [String(product.id), product]))
    return recommendedIds.map((id) => productsById.get(String(id))).filter(Boolean).slice(0, 3)
  }

  const product = selectedProduct.value
  return products.value
    .filter((item) => String(item.id) !== String(product.id))
    .map((item) => ({
      item,
      score:
        Number(item.category === product.category) +
        (item.tags || []).filter((tag) => (product.tags || []).includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item)
})

const additionalRecommendationSections = computed(() => {
  const productsById = new Map(products.value.map((product) => [String(product.id), product]))
  return [
    {
      key: 'customers-also-bought',
      title: 'Customers also bought',
      ids: recommendationGroups.value.customersAlsoBought,
    },
    {
      key: 'frequently-bought-together',
      title: 'Frequently bought together',
      ids: recommendationGroups.value.frequentlyBoughtTogether,
    },
  ]
    .map((section) => ({
      ...section,
      products: section.ids.map((id) => productsById.get(String(id))).filter(Boolean),
    }))
    .filter((section) => section.products.length)
})

async function loadAIRecommendations(productId = '') {
  if (!products.value.length) return
  const requestId = ++recommendationRequestId
  recommendationsLoading.value = true
  recommendationsError.value = ''
  try {
    const result = await aiService.getRecommendations(productId, {
      cart: shopperStore.cart.slice(0, 20),
      wishlist: shopperStore.wishlist.slice(0, 20),
      viewedProducts: shopperStore.viewedProducts.slice(0, 20),
      searchHistory: shopperStore.searchHistory.slice(0, 20),
    })
    if (requestId !== recommendationRequestId) return
    if (productId && String(selectedProduct.value?.id) !== productId) return
    recommendationGroups.value = {
      recommendedForYou: Array.isArray(result.recommendedForYou) ? result.recommendedForYou : [],
      similarProducts: Array.isArray(result.similarProducts) ? result.similarProducts : [],
      customersAlsoBought: Array.isArray(result.customersAlsoBought)
        ? result.customersAlsoBought
        : [],
      frequentlyBoughtTogether: Array.isArray(result.frequentlyBoughtTogether)
        ? result.frequentlyBoughtTogether
        : [],
    }
  } catch (error) {
    console.error('Failed to load AI product recommendations', error)
    if (requestId === recommendationRequestId) {
      recommendationsError.value = 'AI recommendations could not be loaded.'
    }
  } finally {
    if (requestId === recommendationRequestId) recommendationsLoading.value = false
  }
}

function addProductStructuredData(product) {
  removeProductStructuredData()
  previousPageMetadata = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
  }
  const script = document.createElement('script')
  script.id = 'product-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(
    product.structuredData || {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.seoDescription || product.description || '',
      image: product.image ? [product.image] : [],
      category: product.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'SEK',
        price: Number(product.salePrice || product.price),
        availability: 'https://schema.org/InStock',
      },
    },
  )
  document.head.append(script)
  if (product.seoTitle) document.title = product.seoTitle
  if (product.seoDescription) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', product.seoDescription)
  }
  if (product.ogTitle || product.seoTitle) {
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', product.ogTitle || product.seoTitle)
  }
  if (product.ogDescription || product.seoDescription) {
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', product.ogDescription || product.seoDescription)
  }
}

function removeProductStructuredData() {
  document.getElementById('product-structured-data')?.remove()
  if (previousPageMetadata) {
    document.title = previousPageMetadata.title
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      previousPageMetadata.description,
    )
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', previousPageMetadata.ogTitle)
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', previousPageMetadata.ogDescription)
    previousPageMetadata = null
  }
}

async function loadReviews(productId) {
  reviewsLoading.value = true
  reviewError.value = ''
  try {
    productReviews.value = await reviewService.getProductReviews(productId)
  } catch (error) {
    console.error('Failed to load product reviews', error)
    reviewError.value = 'Customer reviews could not be loaded.'
  } finally {
    reviewsLoading.value = false
  }
}

async function submitReview() {
  if (!selectedProduct.value || reviewSubmitting.value) return
  reviewSubmitting.value = true
  reviewError.value = ''
  try {
    await reviewService.createReview({
      productId: selectedProduct.value.id,
      rating: reviewForm.rating,
      body: reviewForm.body,
    })
    reviewForm.body = ''
    await loadReviews(selectedProduct.value.id)
    await refreshReviewStats(selectedProduct.value.id)
  } catch (error) {
    console.error('Failed to submit product review', error)
    reviewError.value = 'Your review could not be submitted. Please try again.'
  } finally {
    reviewSubmitting.value = false
  }
}

async function summarizeReviews() {
  if (!selectedProduct.value || reviewSummaryLoading.value) return
  reviewSummaryLoading.value = true
  reviewError.value = ''
  try {
    reviewSummary.value = await aiService.summarizeProductReviews(selectedProduct.value.id)
  } catch (error) {
    console.error('AI review summary failed', error)
    reviewError.value = 'AI could not summarize these reviews. Please try again later.'
  } finally {
    reviewSummaryLoading.value = false
  }
}

watch([searchValue, selectedCategory, selectedSortOption], () => {
  currentPage.value = 1
})
watch(() => route.query.checkout, handleCheckoutQuery)

const totalPages = computed(() => Math.ceil(filteredProductList.value.length / pageSize))
const paginatedProductList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return filteredProductList.value.slice(startIndex, startIndex + pageSize)
})

const reviewStatsRequests = new Map()
watch(
  () => [
    ...paginatedProductList.value,
    ...personalizedProducts.value,
  ].map((product) => String(product.id)),
  (productIds) => loadReviewStats(productIds),
  { immediate: true },
)

function loadReviewStats(productIds) {
  for (const productId of new Set(productIds)) {
    if (Object.hasOwn(reviewStats.value, productId) || reviewStatsRequests.has(productId)) {
      continue
    }

    reviewStatsLoading.value = new Set([...reviewStatsLoading.value, productId])
    const request = reviewService
      .getProductReviewStats(productId)
      .then((stats) => {
        reviewStats.value = { ...reviewStats.value, [productId]: stats }
        const statsErrors = { ...reviewStatsErrors.value }
        delete statsErrors[productId]
        reviewStatsErrors.value = statsErrors
      })
      .catch((error) => {
        console.error(`Failed to load review statistics for product ${productId}`, error)
        reviewStatsErrors.value = { ...reviewStatsErrors.value, [productId]: true }
      })
      .finally(() => {
        reviewStatsRequests.delete(productId)
        const loadingProducts = new Set(reviewStatsLoading.value)
        loadingProducts.delete(productId)
        reviewStatsLoading.value = loadingProducts
      })
    reviewStatsRequests.set(productId, request)
  }
}

async function refreshReviewStats(productId) {
  try {
    const stats = await reviewService.getProductReviewStats(productId)
    const key = String(productId)
    reviewStats.value = { ...reviewStats.value, [key]: stats }
    const statsErrors = { ...reviewStatsErrors.value }
    delete statsErrors[key]
    reviewStatsErrors.value = statsErrors
  } catch (error) {
    console.error(`Failed to refresh review statistics for product ${productId}`, error)
    reviewStatsErrors.value = { ...reviewStatsErrors.value, [String(productId)]: true }
  }
}

watch([searchValue, selectedCategory, selectedSortOption], () => {
  currentPage.value = 1
})

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = Math.max(pageCount, 1)
  }
})
</script>
<style scoped>
.product-details-dialog {
  width: min(90vw, 42rem);
  max-width: none;
  max-height: 90vh;
  padding: 0;
  overflow: auto;
  border: 0;
  border-radius: 0.5rem;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 25%);
}

.product-details-dialog::backdrop {
  background: rgb(0 0 0 / 60%);
}

.review-dialog {
  padding: 20px;
}

.product-details-image {
  display: block;
  width: 100%;
  max-height: 24rem;
  object-fit: contain;
}

form input,
form textarea {
  color: var(--bs-body-color);
  background-color: var(--bs-body-bg);
}

.hero-section {
  background: linear-gradient(to right, #6a11cb, #2575fc);
  color: white;
  padding: 80px 0;
}
</style>

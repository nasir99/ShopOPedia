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
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="product-list" class="container">
      <h2 class="mb-5 text-center display-6">Discover Our Collection</h2>

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
            v-for="product in filteredProductList"
            :key="product.id"
            :product="product"
            @view-details="showProductDetails"
            @order="startProductOrder"
          ></ProductCard>
        </div>
        <div v-else role="status" aria-live="polite">
          <p class="h3 text-center">No products found.</p>
        </div>
      </div>
    </div>

    <dialog
      ref="productDetailsDialog"
      class="product-details-dialog"
      aria-labelledby="product-details-title"
      @close="selectedProduct = null"
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
              ${{ selectedProduct.salePrice || selectedProduct.price }}
            </span>
            <del v-if="selectedProduct.salePrice" class="text-muted">
              ${{ selectedProduct.price }}
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
          <div class="mt-4">
            <button
              v-if="!showOrderForm"
              class="btn btn-primary"
              type="button"
              @click="showOrderForm = true"
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
              Submit your request to save it for the shop admin, then send the order by email.
            </p>
            <div v-if="orderError" class="alert alert-danger" role="alert">
              {{ orderError }}
            </div>
            <div v-if="savedOrderId" class="alert alert-success" role="status">
              Order request {{ savedOrderId }} is saved. Email the shop to complete your request.
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
            <div class="mb-3">
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
                :disabled="savingOrder"
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
              </template>
            </div>
          </form>
        </div>
      </article>
    </dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import productService from '@/services/productService'
import orderService from '@/services/orderService'
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
const searchValue = ref('')
const selectedSortOption = ref(SORT_OPTIONS[0])
const selectedCategory = ref('ALL')
const categoryList = ref(['ALL', ...PRODUCT_CATEGORIES])
const selectedProduct = ref(null)
const productDetailsDialog = ref(null)
const showOrderForm = ref(false)
const orderMailto = ref('')
const orderGmailUrl = ref('')
const savingOrder = ref(false)
const savedOrderId = ref('')
const orderError = ref('')
const orderForm = reactive({
  name: '',
  email: '',
  phone: '',
  deliveryAddress: '',
  quantity: 1,
})
const orderEmail = 'nasir9973@gmail.com'
onMounted(() => {
  fetchProducts()
})

const showProductDetails = async (product) => {
  selectedProduct.value = product
  showOrderForm.value = false
  orderMailto.value = ''
  orderGmailUrl.value = ''
  savedOrderId.value = ''
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
}

const startProductOrder = async (product) => {
  await showProductDetails(product)
  showOrderForm.value = true
}

const closeProductDetails = () => {
  productDetailsDialog.value?.close()
}

const submitOrder = async () => {
  const product = selectedProduct.value
  if (!product || savingOrder.value || savedOrderId.value) return

  savingOrder.value = true
  orderError.value = ''

  try {
    const orderId = await orderService.createOrder({
      customer: {
        name: orderForm.name,
        email: orderForm.email,
        phone: orderForm.phone,
        deliveryAddress: orderForm.deliveryAddress,
      },
      product: {
        id: String(product.id ?? ''),
        name: product.name,
        category: product.category || '',
        unitPrice: Number(product.salePrice || product.price),
      },
      quantity: orderForm.quantity,
    })

    savedOrderId.value = orderId
    const subject = `Order request: ${product.name} (${orderId})`
    const body = [
      'New product order request',
      `Order reference: ${orderId}`,
      '',
      `Product: ${product.name}`,
      `Category: ${product.category || 'Not specified'}`,
      `Quantity: ${orderForm.quantity}`,
      `Unit price: $${product.salePrice || product.price}`,
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
  } catch (err) {
    console.error('Failed to load products for the home page', err)
    errorMessage.value = 'Products could not be loaded. Please try again later.'
  } finally {
    loading.value = false
  }
}

const filteredProductList = computed(() => {
  let tempArray =
    selectedCategory.value === 'ALL'
      ? [...products.value]
      : products.value.filter(
          (item) => item.category.toUpperCase() === selectedCategory.value.toUpperCase(),
        )

  if (searchValue.value) {
    tempArray = tempArray.filter((item) => {
      return item.name.toUpperCase().includes(searchValue.value.toUpperCase())
    })
  }

  if (selectedSortOption.value === SORT_NAME_A_Z) {
    tempArray.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (selectedSortOption.value === SORT_NAME_Z_A) {
    tempArray.sort((a, b) => b.name.localeCompare(a.name))
  }
  if (selectedSortOption.value === SORT_PRICE_HIGH_LOW) {
    tempArray.sort((a, b) => b.price - a.price)
  }
  if (selectedSortOption.value === SORT_PRICE_LOW_HIGH) {
    tempArray.sort((a, b) => a.price - b.price)
  }

  return tempArray
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

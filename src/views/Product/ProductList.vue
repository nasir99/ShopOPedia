<template>
  <div class="container py-4">
    <div v-if="loading" class="d-flex justify-content-center align-items-center vh-100" role="status" aria-live="polite">
      <div class="spinner-grow text-secondary">
        <span class="visually-hidden">Loading products…</span>
      </div>
    </div>

    <div class="border rounded pb-3 px-2" v-else>
      <div v-if="errorMessage" class="alert alert-danger m-3" role="alert">
        {{ errorMessage }}
      </div>
      <div
        class="card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center p-4"
      >
        <div>
          <h1 class="text-secondary">Products</h1>
          <p class="mb-0 text-muted small">Manage your product listings</p>
        </div>
        <router-link
          :to="{ name: APP_ROUTE_NAMES.PRODUCT_CREATE }"
          class="btn btn-success btn-sm gap-2 rounded-1 px-4 py-2"
        >
          <i class="bi bi-plus-square"></i> &nbsp;
          <span>Add Product</span>
        </router-link>
      </div>

      <div class="card-body p-3">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 table-striped">
            <caption class="visually-hidden">Product listings with category, prices, tags, and actions</caption>
            <thead>
              <tr>
                <th scope="col" class="ps-3 small text-muted">Product</th>
                <th scope="col" class="small text-muted">Category</th>
                <th scope="col" class="small text-muted">Pricing</th>
                <th scope="col" class="small text-muted">Tags</th>
                <th scope="col" class="small text-muted">Bestseller</th>
                <th scope="col" class="pe-3 text-end small text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td class="ps-3">
                  <div class="d-flex align-items-center">
                    <img
                      :src="product.image || 'https://placehold.co/50x50'"
                      class="rounded object-fit-cover me-2"
                      style="width: 50px; height: 50px"
                      :alt="product.name"
                    />
                    <div>
                      <div class="fw-semibold small">{{ product.name }}</div>
                      <small
                        class="text-muted text-truncate d-inline-block"
                        style="max-width: 200px"
                      >
                        {{ product.description }}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary small">
                    {{ product.category }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span
                      class="fw-semibold small"
                      :class="{ 'text-decoration-line-through text-muted': product.salePrice }"
                    >
                      ${{ product.price }}
                    </span>
                    <span v-if="product.salePrice" class="text-danger small">
                      ${{ product.salePrice }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-1">
                    <span
                      class="badge bg-info bg-opacity-10 text-info small"
                      v-for="tag in product.tags"
                      :key="tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    class="badge bg-warning bg-opacity-10 text-warning small"
                    v-if="product.isBestSeller"
                  >
                    Bestseller
                  </span>
                  <span v-else class="text-muted text-center">---</span>
                </td>
                <td class="pe-3 text-end">
                  <button
                    @click="
                      router.push({
                        name: APP_ROUTE_NAMES.PRODUCT_UPDATE,
                        params: { id: product.id },
                      })
                    "
                    class="btn btn-sm btn-outline-secondary m-2"
                    :aria-label="`Edit ${product.name}`"
                  >
                    <i class="bi bi-pencil-fill" aria-hidden="true"></i> Edit
                  </button>

                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="handleProductDelete(product.id)"
                    :aria-label="`Delete ${product.name}`"
                  >
                    <i class="bi bi-trash3-fill" aria-hidden="true"></i> Delete
                  </button>
                </td>
              </tr>
              <tr v-if="products.length === 0 && !errorMessage">
                <td colspan="6" class="text-center text-muted py-4">
                  No products yet. Use Add Product to create your first listing.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import productService from '@/services/productService'
import { useSwal } from '@/composibles/useSwal'
import { APP_ROUTE_NAMES } from '@/constants/routeNames'
import { useRouter } from 'vue-router'
const router = useRouter()
const { showSuccess, showError, showConfirm } = useSwal()

const products = ref([])
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  fetchProducts()
})

const fetchProducts = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    products.value = await productService.getProducts()
  } catch (err) {
    console.error('Failed to load products', err)
    errorMessage.value = 'Products could not be loaded. Please try again later.'
  } finally {
    loading.value = false
  }
}

const handleProductDelete = async (productId) => {
  try {
    loading.value = true
    const confirmResult = await showConfirm('Are you sure you want to delete this product?')
    if (confirmResult.isConfirmed) {
      await productService.deleteProduct(productId)
      await showSuccess('Product deleted successfully')
      await fetchProducts()
    }
  } catch (err) {
    console.log(err)
  } finally {
    loading.value = false
  }
}
</script>

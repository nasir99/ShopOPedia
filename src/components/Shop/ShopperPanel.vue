<template>
  <div>
    <button
      class="shopper-panel-trigger btn btn-success shadow"
      type="button"
      aria-label="Open shopping bag and wishlist"
      @click="panel.showModal()"
    >
      <i class="bi bi-bag" aria-hidden="true"></i>
      Bag <span class="badge text-bg-light">{{ shopperStore.cartCount }}</span>
    </button>

    <dialog ref="panel" class="shopper-panel" aria-labelledby="shopper-panel-title">
      <section>
        <header class="d-flex justify-content-between align-items-center border-bottom p-3">
          <h2 id="shopper-panel-title" class="h5 mb-0">Your shopping</h2>
          <button class="btn-close" aria-label="Close shopping panel" @click="panel.close()"></button>
        </header>
        <div class="p-3">
          <p v-if="shopperStore.profileError" class="alert alert-warning" role="status">
            {{ shopperStore.profileError }}
          </p>
          <p class="small text-muted">
            Guest activity stays in this browser. Sign-in syncs your cart, wishlist, and browsing
            history to your account. AI requests send relevant preferences to Azure OpenAI.
          </p>
          <section aria-labelledby="cart-heading">
            <h3 id="cart-heading" class="h6">Cart ({{ shopperStore.cartCount }})</h3>
            <p v-if="!shopperStore.cart.length" class="text-muted">Your cart is empty.</p>
            <ul v-else class="list-group mb-3">
              <li
                v-for="item in shopperStore.cart"
                :key="item.id"
                class="list-group-item d-flex gap-2 align-items-center"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  width="48"
                  height="48"
                  class="rounded object-fit-cover"
                />
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ item.name }}</div>
                  <small>{{ formatSEK(item.price) }}</small>
                  <label class="visually-hidden" :for="`cart-quantity-${item.id}`">
                    Quantity for {{ item.name }}
                  </label>
                  <input
                    :id="`cart-quantity-${item.id}`"
                    class="form-control form-control-sm mt-1"
                    type="number"
                    min="1"
                    max="99"
                    :value="item.quantity"
                    @change="shopperStore.updateCartQuantity(item.id, $event.target.value)"
                  />
                </div>
                <div>
                  <button
                    class="btn btn-outline-danger btn-sm"
                    type="button"
                    :aria-label="`Remove ${item.name} from cart`"
                    @click="shopperStore.removeFromCart(item.id)"
                  >
                    Remove
                  </button>
                </div>
              </li>
            </ul>
            <p v-if="shopperStore.cart.length" class="fw-semibold">
              Cart total:
              {{
                formatSEK(
                  shopperStore.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                )
              }}
            </p>
            <button
              v-if="shopperStore.cart.length"
              class="btn btn-primary w-100"
              type="button"
              @click="startCartCheckout"
            >
              Checkout all items
            </button>
          </section>

          <section aria-labelledby="wishlist-heading" class="border-top pt-3">
            <h3 id="wishlist-heading" class="h6">Wishlist ({{ shopperStore.wishlist.length }})</h3>
            <p v-if="!shopperStore.wishlist.length" class="text-muted">
              You have no saved products.
            </p>
            <ul v-else class="list-group">
              <li
                v-for="item in shopperStore.wishlist"
                :key="item.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ item.name }} · {{ formatSEK(item.price) }}</span>
                <button
                  class="btn btn-sm btn-outline-danger"
                  type="button"
                  :aria-label="`Remove ${item.name} from wishlist`"
                  @click="shopperStore.toggleWishlist(item)"
                >
                  Remove
                </button>
              </li>
            </ul>
          </section>
          <button
            class="btn btn-link btn-sm px-0 mt-3"
            type="button"
            :disabled="!shopperStore.viewedProducts.length && !shopperStore.searchHistory.length"
            @click="shopperStore.clearActivity()"
          >
            Clear browsing and search activity
          </button>
        </div>
      </section>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useShopperStore } from '@/stores/shopperStore'

const panel = ref(null)
const router = useRouter()
const shopperStore = useShopperStore()

function formatSEK(amount) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(
    Number(amount) || 0,
  )
}

function startCartCheckout() {
  panel.value?.close()
  router.push({
    path: '/',
    query: { checkout: 'cart' },
  })
}
</script>

<style scoped>
.shopper-panel-trigger {
  position: fixed;
  z-index: 1040;
  bottom: 1rem;
  left: 1rem;
}

.shopper-panel {
  width: min(94vw, 36rem);
  max-width: none;
  max-height: 85vh;
  padding: 0;
  overflow: auto;
  border: 0;
  border-radius: 0.75rem;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 25%);
}

.shopper-panel::backdrop {
  background: rgb(0 0 0 / 55%);
}
</style>

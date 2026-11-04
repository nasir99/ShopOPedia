<template>
  <div>
    <button
      class="ai-assistant-trigger btn btn-primary rounded-pill shadow"
      type="button"
      @click="openAssistant"
      aria-label="Open AI shopping assistant"
    >
      <i class="bi bi-chat-dots" aria-hidden="true"></i>
      Shopping assistant
    </button>

    <dialog ref="dialog" class="assistant-dialog" aria-labelledby="assistant-title">
      <section class="assistant-content">
        <header class="d-flex justify-content-between align-items-center border-bottom p-3">
          <div>
            <h2 id="assistant-title" class="h5 mb-0">AI shopping assistant</h2>
            <p class="small text-muted mb-0">
              Recommendations may use your saved cart and browsing activity. Messages and relevant
              preferences are sent to Azure OpenAI.
            </p>
          </div>
          <button class="btn-close" aria-label="Close assistant" @click="dialog.close()"></button>
        </header>

        <div class="assistant-messages p-3" aria-live="polite">
          <p v-for="(message, index) in messages" :key="index" class="mb-3">
            <strong>{{ message.role === 'user' ? 'You' : 'Assistant' }}:</strong>
            {{ message.text }}
          </p>
          <div v-if="recommendedProducts.length" class="list-group">
            <article
              v-for="product in recommendedProducts"
              :key="product.id"
              class="list-group-item d-flex gap-2 align-items-center"
            >
              <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                width="48"
                height="48"
                class="rounded object-fit-cover"
              />
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ product.name }}</div>
                <small>{{ formatSEK(product.salePrice || product.price) }}</small>
              </div>
              <button
                class="btn btn-sm btn-outline-success"
                type="button"
                :aria-label="`Add ${product.name} to cart`"
                @click="shopperStore.addToCart(product)"
              >
                Add to cart
              </button>
            </article>
          </div>
          <p v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
            {{ errorMessage }}
          </p>
          <div v-if="sending" class="small text-muted" role="status">Thinking…</div>
        </div>

        <form class="border-top p-3" @submit.prevent="sendMessage">
          <label for="assistant-message" class="visually-hidden">Ask for shopping help</label>
          <div class="input-group">
            <input
              id="assistant-message"
              v-model.trim="draft"
              class="form-control"
              placeholder="Ask about styles, sizes, or products…"
              maxlength="500"
              :disabled="sending"
              required
            />
            <button class="btn btn-primary" type="submit" :disabled="sending || !draft">
              Send
            </button>
          </div>
          <button
            class="btn btn-link btn-sm px-0 mt-2"
            type="button"
            :disabled="sending"
            @click="askForRecommendations"
          >
            Recommend products based on my activity
          </button>
        </form>
      </section>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import aiService from '@/services/aiService'
import productService from '@/services/productService'
import { useShopperStore } from '@/stores/shopperStore'

const dialog = ref(null)
const draft = ref('')
const messages = ref([
  {
    role: 'assistant',
    text: 'Tell me what you are looking for, and I will help find a match.',
  },
])
const products = ref([])
const recommendedProducts = ref([])
const sending = ref(false)
const errorMessage = ref('')
const shopperStore = useShopperStore()

async function openAssistant() {
  dialog.value?.showModal()
  if (!products.value.length) {
    try {
      products.value = await productService.getProducts()
    } catch (error) {
      console.error('Failed to load products for the shopping assistant', error)
      errorMessage.value = 'Product recommendations are unavailable right now.'
    }
  }
}

async function askForRecommendations() {
  await sendToAssistant(
    'Recommend products based on my shopping activity, saved products, and cart.',
    false,
  )
}

async function sendMessage() {
  if (!draft.value) return
  const message = draft.value
  draft.value = ''
  await sendToAssistant(message, true)
}

async function sendToAssistant(message, includeUserMessage) {
  if (sending.value) return
  errorMessage.value = ''
  recommendedProducts.value = []
  if (includeUserMessage) messages.value.push({ role: 'user', text: message })
  sending.value = true

  try {
    const result = await aiService.chat(message, {
      products: products.value.slice(0, 40).map(toAIProduct),
      cart: shopperStore.cart.slice(0, 20).map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      preferences: JSON.stringify({
        wishlist: shopperStore.wishlist,
        viewedProducts: shopperStore.viewedProducts,
        searchHistory: shopperStore.searchHistory,
        purchaseHistory: shopperStore.purchaseHistory,
      }).slice(0, 1200),
      history: messages.value
        .slice(0, includeUserMessage ? -1 : undefined)
        .slice(-8)
        .map((item) => ({ role: item.role, content: item.text })),
    })
    messages.value.push({ role: 'assistant', text: result.reply })
    const ids = new Set((result.productIds || []).map(String))
    recommendedProducts.value = products.value.filter((product) => ids.has(String(product.id)))
  } catch (error) {
    console.error('AI shopping assistant request failed', error)
    errorMessage.value =
      'The AI assistant service is unavailable. The shop administrator must deploy the Firebase shoppingAssistant function in europe-west1 and configure its Azure OpenAI settings.'
  } finally {
    sending.value = false
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

function formatSEK(amount) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(
    Number(amount) || 0,
  )
}
</script>

<style scoped>
.ai-assistant-trigger {
  position: fixed;
  z-index: 1040;
  right: 1rem;
  bottom: 1rem;
}

.assistant-dialog {
  width: min(94vw, 36rem);
  max-width: none;
  max-height: 85vh;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0.75rem;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 25%);
}

.assistant-dialog::backdrop {
  background: rgb(0 0 0 / 55%);
}

.assistant-content {
  display: flex;
  max-height: 85vh;
  flex-direction: column;
}

.assistant-messages {
  min-height: 8rem;
  overflow-y: auto;
}
</style>

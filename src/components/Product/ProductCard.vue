<template>
  <div class="col-sm-6 col-lg-4 col-xl-3">
    <article class="card h-100">
      <img
        :src="product.image || 'https://placehold.co/600x400?text=Product'"
        class="card-img-top object-fit-cover"
        style="height: 220px"
        :alt="product.name"
        loading="lazy"
        decoding="async"
      />
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <h3 class="h5 card-title">{{ product.name }}</h3>
          <span v-if="product.isBestSeller" class="badge text-bg-warning">Bestseller</span>
        </div>
        <p class="text-muted small mb-2">{{ product.category }}</p>
        <p class="card-text flex-grow-1">{{ product.description }}</p>
        <section
          v-if="reviewStats || reviewStatsLoading || reviewStatsError"
          class="border-top pt-2 mb-2"
          :aria-label="`Customer reviews for ${product.name}`"
        >
          <template v-if="!reviewStatsLoading">
            <button
              class="btn btn-link btn-sm p-0 text-start fw-semibold"
              type="button"
              :aria-label="`View reviews for ${product.name}`"
              :disabled="!reviewStats || reviewStats.total === 0"
              @click="showReviews"
            >
              <template v-if="reviewStats && reviewStats.total">
                <span aria-label="Average rating">★ {{ reviewStats.average.toFixed(1) }}/5</span>
                · {{ reviewStats.total }}
                {{ reviewStats.total === 1 ? 'review' : 'reviews' }}
                · Read reviews
              </template>
              <span v-else-if="reviewStats">No reviews yet</span>
              <span v-else-if="reviewStatsError" class="text-warning">
                Review rating unavailable
              </span>
            </button>
          </template>
        </section>
        <div class="d-flex align-items-baseline gap-2">
          <span class="fw-semibold">{{ formatSEK(product.salePrice || product.price) }}</span>
          <del v-if="product.salePrice" class="small text-muted">{{
            formatSEK(product.price)
          }}</del>
        </div>
        <button
          class="btn btn-outline-primary mt-3"
          type="button"
          :aria-label="`View details for ${product.name}`"
          @click="viewDetails"
        >
          View details
        </button>
        <button
          class="btn btn-primary mt-2"
          type="button"
          :aria-label="`Order ${product.name}`"
          @click="startOrder"
        >
          Order now
        </button>
        <div class="d-flex gap-2 mt-2">
          <button
            class="btn btn-outline-success flex-grow-1"
            type="button"
            :aria-label="`Add ${product.name} to cart`"
            @click="shopperStore.addToCart(product)"
          >
            Add to cart
          </button>
          <button
            class="btn btn-outline-danger"
            type="button"
            :aria-label="`${shopperStore.isInWishlist(product.id) ? 'Remove' : 'Add'} ${product.name} ${shopperStore.isInWishlist(product.id) ? 'from' : 'to'} wishlist`"
            :aria-pressed="shopperStore.isInWishlist(product.id)"
            @click="shopperStore.toggleWishlist(product)"
          >
            <i
              class="bi"
              :class="shopperStore.isInWishlist(product.id) ? 'bi-heart-fill' : 'bi-heart'"
              aria-hidden="true"
            ></i>
            <span class="visually-hidden">Wishlist</span>
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { useShopperStore } from '@/stores/shopperStore'

const emit = defineEmits(['view-details', 'order', 'show-reviews'])
const shopperStore = useShopperStore()

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  reviewStatsLoading: {
    type: Boolean,
    default: false,
  },
  reviewStats: {
    type: Object,
    default: null,
  },
  reviewStatsError: {
    type: Boolean,
    default: false,
  },
})

const formatSEK = (amount) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(
    Number(amount) || 0,
  )

function viewDetails() {
  shopperStore.trackView(props.product)
  emit('view-details', props.product)
}

function startOrder() {
  shopperStore.trackView(props.product)
  emit('order', props.product)
}

function showReviews() {
  emit('show-reviews', props.product)
}
</script>

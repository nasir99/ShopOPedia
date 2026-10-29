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
        <div class="d-flex align-items-baseline gap-2">
          <span class="fw-semibold">${{ product.salePrice || product.price }}</span>
          <del v-if="product.salePrice" class="small text-muted">${{ product.price }}</del>
        </div>
        <button
          class="btn btn-outline-primary mt-3"
          type="button"
          :aria-label="`View details for ${product.name}`"
          @click="$emit('view-details', product)"
        >
          View details
        </button>
        <button
          class="btn btn-primary mt-2"
          type="button"
          :aria-label="`Order ${product.name}`"
          @click="$emit('order', product)"
        >
          Order now
        </button>
      </div>
    </article>
  </div>
</template>

<script setup>
defineEmits(['view-details', 'order'])

defineProps({
  product: {
    type: Object,
    required: true,
  },
})
</script>

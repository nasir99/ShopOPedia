import { httpsCallable } from 'firebase/functions'
import { functions } from '@/utility/firebaseConfig'

async function callAI(name, payload) {
  const response = await httpsCallable(functions, name)(payload)
  return response.data
}

export default {
  searchProducts(query, products) {
    return callAI('naturalProductSearch', { query, products })
  },

  chat(message, context) {
    return callAI('shoppingAssistant', { message, context })
  },

  getRecommendations(productId, profile) {
    return callAI('getProductRecommendations', {
      productId: productId || null,
      profile,
    })
  },

  visualSearch(imageBase64, mimeType, products) {
    return callAI('visualProductSearch', { imageBase64, mimeType, products })
  },

  generateProductMetadata(product) {
    return callAI('generateProductMetadata', { product })
  },

  summarizeProductReviews(productId) {
    return callAI('summarizeProductReviews', { productId })
  },
}

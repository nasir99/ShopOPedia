import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from '@/utility/firebaseConfig'

function uniqueReviews(snapshot) {
  const reviewsByCustomer = new Map()
  for (const reviewDoc of snapshot.docs) {
    const review = { id: reviewDoc.id, ...reviewDoc.data() }
    const customerKey =
      typeof review.userId === 'string' && review.userId ? review.userId : reviewDoc.id
    if (!reviewsByCustomer.has(customerKey)) {
      reviewsByCustomer.set(customerKey, review)
    }
  }
  return [...reviewsByCustomer.values()]
}

export default {
  async getProductReviews(productId, maxReviews = 50) {
    const reviewCollection = collection(db, 'products', String(productId), 'reviews')
    const requestedLimit = Math.min(50, Math.max(1, Math.floor(Number(maxReviews) || 50)))
    const reviewsQuery = query(reviewCollection, orderBy('createdAt', 'desc'), limit(50))
    const snapshot = await getDocs(reviewsQuery)
    return uniqueReviews(snapshot).slice(0, requestedLimit)
  },

  async getProductReviewStats(productId) {
    const reviewCollection = collection(db, 'products', String(productId), 'reviews')
    const snapshot = await getDocs(query(reviewCollection, orderBy('createdAt', 'desc')))
    const reviews = uniqueReviews(snapshot).filter(
      (review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5,
    )
    const total = reviews.length
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0)
    return {
      total,
      average: total > 0 ? ratingSum / total : 0,
    }
  },

  async createReview({ productId, rating, body }) {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('You must sign in to submit a review.')

    const reviewCollection = collection(db, 'products', String(productId), 'reviews')
    const reviewRef = doc(reviewCollection, currentUser.uid)
    const existingReview = await getDoc(reviewRef)
    const reviewFields = {
      rating: Number(rating),
      body: String(body).trim(),
    }

    if (existingReview.exists()) {
      await updateDoc(reviewRef, reviewFields)
      return { id: reviewRef.id, ...existingReview.data(), ...reviewFields }
    }

    const review = {
      userId: currentUser.uid,
      authorName: currentUser.displayName || 'Customer',
      ...reviewFields,
      createdAt: serverTimestamp(),
    }
    await setDoc(reviewRef, review)
    return { id: reviewRef.id, ...review }
  },
}

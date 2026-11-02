import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/utility/firebaseConfig'

const orderCollection = collection(db, 'orders')

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'cancelled']

export default {
  async createOrder(orderData) {
    const docRef = await addDoc(orderCollection, {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    return docRef.id
  },

  async getOrders() {
    const ordersQuery = query(orderCollection, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(ordersQuery)

    return snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data(),
    }))
  },

  async updateOrderStatus(orderId, status) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error(`Unsupported order status: ${status}`)
    }

    await updateDoc(doc(orderCollection, orderId), { status })
  },
}

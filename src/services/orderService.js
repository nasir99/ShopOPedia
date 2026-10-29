import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '@/utility/firebaseConfig'

const orderCollection = collection(db, 'orders')

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
}

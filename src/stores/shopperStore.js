import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/utility/firebaseConfig'

const GUEST_STORAGE_KEY = 'shopopedia-shopper-profile-guest'
const MAX_ACTIVITY_ITEMS = 50
const MAX_SAVED_ITEMS = 50

function readLocalProfile(storageKey) {
  try {
    const savedProfile = localStorage.getItem(storageKey)
    if (!savedProfile) return {}
    const parsedProfile = JSON.parse(savedProfile)
    return parsedProfile && typeof parsedProfile === 'object' && !Array.isArray(parsedProfile)
      ? parsedProfile
      : {}
  } catch (error) {
    console.error('Failed to read the local shopper profile', error)
    return {}
  }
}

export const useShopperStore = defineStore('shopperStore', () => {
  const savedProfile = readLocalProfile(GUEST_STORAGE_KEY)
  const cart = ref(Array.isArray(savedProfile.cart) ? savedProfile.cart : [])
  const wishlist = ref(Array.isArray(savedProfile.wishlist) ? savedProfile.wishlist : [])
  const viewedProducts = ref(
    Array.isArray(savedProfile.viewedProducts) ? savedProfile.viewedProducts : [],
  )
  const searchHistory = ref(Array.isArray(savedProfile.searchHistory) ? savedProfile.searchHistory : [])
  const purchaseHistory = ref(
    Array.isArray(savedProfile.purchaseHistory) ? savedProfile.purchaseHistory : [],
  )
  const profileError = ref('')
  const syncingProfile = ref(false)
  let signedInUserId = null
  let saveTimeout

  const cartCount = computed(() =>
    cart.value.reduce((count, item) => count + Number(item.quantity || 0), 0),
  )

  function persistLocalProfile() {
    const profile = {
      cart: cart.value,
      wishlist: wishlist.value,
      viewedProducts: viewedProducts.value.slice(0, MAX_ACTIVITY_ITEMS),
      searchHistory: searchHistory.value.slice(0, 20),
      purchaseHistory: purchaseHistory.value.slice(0, MAX_ACTIVITY_ITEMS),
    }

    try {
      const storageKey = signedInUserId
        ? `shopopedia-shopper-profile-${signedInUserId}`
        : GUEST_STORAGE_KEY
      localStorage.setItem(storageKey, JSON.stringify(profile))
    } catch (error) {
      console.error('Failed to save the local shopper profile', error)
      profileError.value = 'Your shopping activity could not be saved in this browser.'
    }

    if (signedInUserId) {
      const userId = signedInUserId
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => saveCloudProfile(userId), 400)
    }
  }

  function restoreLocalProfile(profile) {
    const snapshots = (items) =>
      (Array.isArray(items) ? items : [])
        .filter(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            item.id.length <= 128 &&
            typeof item.name === 'string' &&
            item.name.length <= 160,
        )
        .slice(0, MAX_ACTIVITY_ITEMS)
    cart.value = snapshots(profile.cart)
      .filter(
        (item) =>
          Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 99 &&
          Number.isFinite(Number(item.price)) &&
          Number(item.price) >= 0,
      )
      .map((item) => ({ ...item, price: Number(item.price) }))
    wishlist.value = snapshots(profile.wishlist).map((item) => ({
      ...item,
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
    }))
    viewedProducts.value = snapshots(profile.viewedProducts)
    searchHistory.value = (Array.isArray(profile.searchHistory) ? profile.searchHistory : [])
      .filter((item) => typeof item === 'string' && item.length <= 500)
      .slice(0, 20)
    purchaseHistory.value = (Array.isArray(profile.purchaseHistory) ? profile.purchaseHistory : [])
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        ...item,
        id: typeof item.productId === 'string' ? item.productId : item.id,
      }))
      .filter((item) => typeof item.id === 'string' && item.id.length <= 128)
      .slice(-MAX_ACTIVITY_ITEMS)
  }

  async function saveCloudProfile(userId) {
    if (signedInUserId !== userId) return

    syncingProfile.value = true
    profileError.value = ''
    try {
      await setDoc(
        doc(db, 'users', userId, 'shopperProfiles', 'preferences'),
        {
          cart: cart.value,
          wishlist: wishlist.value,
          viewedProducts: viewedProducts.value.slice(0, MAX_ACTIVITY_ITEMS),
          searchHistory: searchHistory.value.slice(0, 20),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error('Failed to sync the shopper profile to Firestore', error)
      profileError.value =
        'Your shopping activity is saved on this device but could not sync to your account.'
    } finally {
      syncingProfile.value = false
    }
  }

  async function loadForUser(user) {
    const nextUserId = user?.uid ?? null
    if (signedInUserId === nextUserId) return
    clearTimeout(saveTimeout)
    signedInUserId = nextUserId
    profileError.value = ''
    if (!nextUserId) {
      restoreLocalProfile(readLocalProfile(GUEST_STORAGE_KEY))
      return
    }

    restoreLocalProfile(readLocalProfile(`shopopedia-shopper-profile-${nextUserId}`))

    syncingProfile.value = true
    try {
      const profileDoc = await getDoc(
        doc(db, 'users', nextUserId, 'shopperProfiles', 'preferences'),
      )
      if (signedInUserId !== nextUserId) return
      if (!profileDoc.exists()) {
        await saveCloudProfile(nextUserId)
        return
      }

      const profile = profileDoc.data()
      restoreLocalProfile({ ...readLocalProfile(`shopopedia-shopper-profile-${nextUserId}`), ...profile })
      persistLocalProfile()
    } catch (error) {
      console.error('Failed to load the shopper profile from Firestore', error)
      profileError.value =
        'Your account shopping activity could not be loaded. This device’s saved activity is still available.'
    } finally {
      syncingProfile.value = false
    }
  }

  function trackView(product) {
    if (!product?.id) return
    viewedProducts.value = [
      { id: String(product.id), name: product.name, category: product.category },
      ...viewedProducts.value.filter((item) => item.id !== String(product.id)),
    ].slice(0, MAX_ACTIVITY_ITEMS)
    persistLocalProfile()
  }

  function trackSearch(search) {
    const text = String(search || '').trim()
    if (!text) return
    searchHistory.value = [text, ...searchHistory.value.filter((entry) => entry !== text)].slice(
      0,
      20,
    )
    persistLocalProfile()
  }

  function isInWishlist(productId) {
    return wishlist.value.some((item) => item.id === String(productId))
  }

  function toggleWishlist(product) {
    if (!product?.id) return
    const id = String(product.id)
    if (!isInWishlist(id) && wishlist.value.length >= MAX_SAVED_ITEMS) {
      profileError.value = `Wishlist is limited to ${MAX_SAVED_ITEMS} products.`
      return
    }
    profileError.value = ''
    wishlist.value = isInWishlist(id)
      ? wishlist.value.filter((item) => item.id !== id)
      : [
          ...wishlist.value,
          { id, name: product.name, category: product.category, price: product.salePrice || product.price },
        ]
    persistLocalProfile()
  }

  function addToCart(product, quantity = 1) {
    if (!product?.id) return
    const id = String(product.id)
    const existing = cart.value.find((item) => item.id === id)
    if (!existing && cart.value.length >= MAX_SAVED_ITEMS) {
      profileError.value = `Cart is limited to ${MAX_SAVED_ITEMS} different products.`
      return
    }
    profileError.value = ''
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + quantity)
    } else {
      cart.value = [
        ...cart.value,
        {
          id,
          name: product.name,
          category: product.category,
          price: Number(product.salePrice || product.price),
          image: product.image || '',
          quantity: Math.min(99, Math.max(1, Number(quantity) || 1)),
        },
      ]
    }
    persistLocalProfile()
  }

  function removeFromCart(productId) {
    cart.value = cart.value.filter((item) => item.id !== String(productId))
    persistLocalProfile()
  }

  function updateCartQuantity(productId, quantity) {
    const item = cart.value.find((entry) => entry.id === String(productId))
    if (!item) return
    const nextQuantity = Number(quantity)
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || nextQuantity > 99) return
    item.quantity = nextQuantity
    persistLocalProfile()
  }

  function clearCart() {
    cart.value = []
    persistLocalProfile()
  }

  function clearActivity() {
    viewedProducts.value = []
    searchHistory.value = []
    persistLocalProfile()
  }

  watch([cart, wishlist, viewedProducts, searchHistory, purchaseHistory], persistLocalProfile, {
    deep: true,
  })

  return {
    cart,
    cartCount,
    wishlist,
    viewedProducts,
    searchHistory,
    purchaseHistory,
    profileError,
    syncingProfile,
    loadForUser,
    trackView,
    trackSearch,
    isInWishlist,
    toggleWishlist,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    clearActivity,
  }
})

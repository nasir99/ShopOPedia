import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '@/utility/firebaseConfig'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { ROLE_ADMIN, ROLE_USER } from '@/constants/appConstants'
export const useAuthStore = defineStore('authStore', () => {
  let authInitializationPromise
  const user = ref(null)
  const error = ref(null)
  const isLoading = ref(false)
  const role = ref(null)
  const initialized = ref(false)
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => role.value === ROLE_ADMIN)

  const initializeAuth = async () => {
    if (authInitializationPromise) return authInitializationPromise

    authInitializationPromise = new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            user.value = firebaseUser
            await fetchUserRole(firebaseUser.uid)
          } else {
            clearUser()
          }
          error.value = null
          initialized.value = true
          resolve()
        } catch (err) {
          error.value = err.message
          initialized.value = true
          role.value = null
          reject(err)
        }
      }, (err) => {
        error.value = err.message
        initialized.value = true
        reject(err)
      })
    })
    return authInitializationPromise
  }

  const fetchUserRole = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid))
    role.value = userDoc.exists() ? userDoc.data().role : ''
  }

  const signUpUser = async (email, password) => {
    isLoading.value = true
    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', userCredentials.user.uid), {
        email: userCredentials.user.email,
        role: ROLE_USER,
        createdAt: new Date(),
      })

      user.value = userCredentials.user
      role.value = ROLE_USER
      error.value = null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearUser = () => {
    user.value = null
    role.value = null
  }

  const signInUser = async (email, password) => {
    isLoading.value = true
    try {
      const userCredentials = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredentials.user
      await fetchUserRole(userCredentials.user.uid)
      error.value = null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signOutUser = async () => {
    isLoading.value = true
    try {
      await signOut(auth)
      clearUser()
      error.value = null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // state
    user,
    role,
    error,
    isLoading,
    initialized,
    //getters
    isAdmin,
    isAuthenticated,

    // actions
    signUpUser,
    signInUser,
    signOutUser,
    initializeAuth,
  }
})

import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/home/Home.vue'
import contactUs from '@/views/home/ContactUs.vue'
import accessdenied from '@/views/auth/AccessDenied.vue'
import NotFound from '@/views/auth/NotFound.vue'
import SignIn from '@/views/auth/SignIn.vue'
import SignUp from '@/views/auth/SignUp.vue'
import ProductList from '@/views/Product/ProductList.vue'
import ProductCreate from '@/views/Product/ProductCreate.vue'
import { APP_ROUTE_NAMES } from '@/constants/routeNames.js'
import { ROLE_ADMIN } from '@/constants/appConstants.js'
import { useAuthStore } from '@/stores/authStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: APP_ROUTE_NAMES.HOME,
      component: Home,
      meta: {
        title: 'Shoes and Clothes for Children and Adults',
        description:
          "Explore Salena's Webshop collection of shoes and clothes for children and adults.",
      },
    },
    {
      path: '/contact-us',
      name: APP_ROUTE_NAMES.CONTACT_US,
      component: contactUs,
      meta: {
        title: 'Contact',
        description:
          "Get in touch with Salena's webshop for questions about our clothing and shoe products and services.",
      },
    },
    {
      path: '/access-denied',
      name: APP_ROUTE_NAMES.ACCESS_DENIED,
      component: accessdenied,
      meta: { title: 'Access denied', noindex: true },
    },
    {
      path: '/not-found',
      name: APP_ROUTE_NAMES.NOT_FOUND,
      component: NotFound,
      meta: { title: 'Page not found', noindex: true },
    },
    {
      path: '/sign-in',
      name: APP_ROUTE_NAMES.SIGN_IN,
      component: SignIn,
      meta: { title: 'Sign in', noindex: true },
    },
    {
      path: '/sign-up',
      name: APP_ROUTE_NAMES.SIGN_UP,
      component: SignUp,
      meta: { title: 'Create an account', noindex: true },
    },
    {
      path: '/products',
      name: APP_ROUTE_NAMES.PRODUCT_LIST,
      component: ProductList,
      meta: { title: 'Manage products', noindex: true, requiresAuth: true, roles: [ROLE_ADMIN] },
    },
    {
      path: '/product',
      name: APP_ROUTE_NAMES.PRODUCT_CREATE,
      component: ProductCreate,
      meta: { title: 'Add a product', noindex: true, requiresAuth: true, roles: [ROLE_ADMIN] },
    },
    {
      path: '/product/:id',
      name: APP_ROUTE_NAMES.PRODUCT_UPDATE,
      component: ProductCreate,
      meta: { title: 'Edit product', noindex: true, requiresAuth: true, roles: [ROLE_ADMIN] },
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFound,
      meta: { title: 'Page not found', noindex: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiresAuthorization = to.matched.some(
    (route) => route.meta.requiresAuth || route.meta.roles,
  )

  if (!requiresAuthorization) return true

  try {
    if (!authStore.initialized) await authStore.initializeAuth()
  } catch (error) {
    console.error('Unable to verify the current user before navigation', error)
    return { name: APP_ROUTE_NAMES.ACCESS_DENIED }
  }

  if (!authStore.isAuthenticated) {
    return {
      name: APP_ROUTE_NAMES.SIGN_IN,
      query: { redirect: to.fullPath },
    }
  }

  const allowedRoles = to.matched.flatMap((route) => route.meta.roles ?? [])
  if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.role)) {
    return { name: APP_ROUTE_NAMES.ACCESS_DENIED }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title
    ? `${to.meta.title} | Salena's Webshop`
    : "Salena's Webshop | Shoes and Clothes for Children and Adults"
  document.title = title

  const description =
    to.meta.description ??
    "Explore Salena's Webshop collection of shoes and clothes for children and adults."
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', "Salena's Webshop")
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title)
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description)

  const robots = document.querySelector('meta[name="robots"]')
  if (to.meta.noindex) {
    const robotsMeta = robots ?? document.createElement('meta')
    robotsMeta.setAttribute('name', 'robots')
    robotsMeta.setAttribute('content', 'noindex, nofollow')
    if (!robots) document.head.append(robotsMeta)
  } else {
    robots?.remove()
  }
})

export default router

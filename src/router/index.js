import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/auth/login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/auth/register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/auth/forgot-password',
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/auth/reset-password',
    component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/map',
    component: () => import('@/pages/MapPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trips',
    component: () => import('@/pages/TripsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trips/new',
    component: () => import('@/pages/TripDetailPage.vue'),
    props: { mode: 'new' },
    meta: { requiresAuth: true }
  },
  {
    path: '/trips/:id',
    component: () => import('@/pages/TripDetailPage.vue'),
    props: route => ({ mode: 'view', id: route.params.id }),
    meta: { requiresAuth: true }
  },
  {
    path: '/trips/:id/edit',
    component: () => import('@/pages/TripDetailPage.vue'),
    props: route => ({ mode: 'edit', id: route.params.id }),
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    component: () => import('@/pages/TagsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    component: () => import('@/pages/UsersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/map'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/map'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise(resolve => {
      const unwatch = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(unwatch)
          resolve()
        }
      }, 50)
    })
  }

  const isAuthRoute = to.path.startsWith('/auth/')
  const isLoggedIn = !!authStore.user

  if (!isLoggedIn && !isAuthRoute) {
    return '/auth/login'
  }

  if (isLoggedIn && isAuthRoute && to.path !== '/auth/reset-password') {
    return '/map'
  }

  return true
})

export default router

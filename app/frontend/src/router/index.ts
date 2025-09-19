import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'

// Route definitions
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Sign In' }
  },
  {
    path: '/',
    component: () => import('@components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@views/DashboardView.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@views/ProfileView.vue'),
        meta: { title: 'Profile' }
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@views/SearchView.vue'),
        meta: { title: 'Search' }
      },
      {
        path: 'documents',
        name: 'documents',
        component: () => import('@views/DocumentsView.vue'),
        meta: { title: 'Documents' }
      },
      {
        path: 'portfolio',
        name: 'portfolio',
        component: () => import('@views/PortfolioView.vue'),
        meta: { title: 'Portfolio' }
      },
      {
        path: 'capital-activity',
        name: 'capital-activity',
        component: () => import('@views/CapitalActivityView.vue'),
        meta: { title: 'Capital Activity' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@views/SettingsView.vue'),
        meta: { title: 'Settings' }
      },
      {
        path: 'contact',
        name: 'contact',
        component: () => import('@views/ContactView.vue'),
        meta: { title: 'Contact' }
      },
      {
        path: 'communications',
        name: 'communications',
        component: () => import('@views/CommunicationsView.vue'),
        meta: { title: 'Communications' }
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@views/admin/UserRoleManagementView.vue'),
        meta: {
          title: 'Administration',
          requiresRole: 'SUPER_ADMIN'
        }
      }
    ]
  },
  // Catch-all redirect
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  console.log('Navigation guard triggered:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth !== false,
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    hasToken: !!authStore.accessToken
  })

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - PE Investor Portal`
  }

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    // If still no user after initialization, try to fetch from API
    if (authStore.accessToken && !authStore.user) {
      console.log('Has token but no user, fetching current user...')
      try {
        await authStore.getCurrentUser()
        console.log('Successfully fetched current user, auth state:', {
          isAuthenticated: authStore.isAuthenticated,
          hasUser: !!authStore.user,
          userEmail: authStore.user?.email
        })
      } catch (error) {
        // If getting user fails, redirect to login
        console.error('Failed to get current user:', error)
        console.log('Clearing auth state and redirecting to login')
        authStore.logout()
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated, redirecting to login')
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check role-based access control
    if (to.meta.requiresRole) {
      const userRoles = authStore.user?.roles || []
      const requiredRole = to.meta.requiresRole as string

      if (!userRoles.includes(requiredRole)) {
        console.log(`Access denied: User does not have required role ${requiredRole}`)
        // Redirect to dashboard with error message
        next({
          name: 'dashboard',
          query: { error: 'insufficient_permissions' }
        })
        return
      }
    }
  } else {
    // If user is authenticated and trying to access login page, redirect to dashboard
    if (authStore.isAuthenticated && to.name === 'login') {
      console.log('Authenticated user accessing login, redirecting to dashboard')
      next({ name: 'dashboard' })
      return
    }
  }

  console.log('Navigation guard allowing access to:', to.path)
  next()
})

export default router

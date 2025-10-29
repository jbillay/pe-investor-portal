import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { usePluginRegistryStore } from '@stores/pluginRegistry'

// Route definitions
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Sign In' }
  },
  {
    path: '/set-password',
    name: 'set-password',
    component: () => import('@views/auth/SetPasswordView.vue'),
    meta: { requiresAuth: true, requiresPasswordChange: true, title: 'Set Password' }
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
        redirect: '/admin/users'
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('@views/admin/UserManagementView.vue'),
        meta: {
          title: 'User Management',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/roles',
        name: 'admin-roles',
        component: () => import('@views/admin/RoleManagementView.vue'),
        meta: {
          title: 'Role Management',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/analytics',
        name: 'admin-analytics',
        component: () => import('@views/admin/AnalyticsView.vue'),
        meta: {
          title: 'System Analytics',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/email-templates',
        name: 'email-templates',
        component: () => import('@views/admin/EmailTemplateManagementView.vue'),
        meta: {
          title: 'Email Template Management',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/plugins',
        name: 'admin-plugins',
        component: () => import('@views/admin/PluginManagementView.vue'),
        meta: {
          title: 'Plugin Management',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/data-objects',
        name: 'data-objects',
        component: () => import('@views/admin/DataObjectManagerView.vue'),
        meta: {
          title: 'Data Objects',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'admin/data-objects/:id',
        name: 'data-object-edit',
        component: () => import('@views/admin/DataObjectEditorView.vue'),
        meta: {
          title: 'Edit Data Object',
          requiresRole: 'SUPER_ADMIN'
        }
      },
      {
        path: 'dynamic/:dataKey',
        name: 'dynamic-list',
        component: () => import('@views/DynamicListView.vue'),
        meta: { title: 'Data' }
      },
      {
        path: 'dynamic/:dataKey/create',
        name: 'dynamic-create',
        component: () => import('@views/DynamicFormView.vue'),
        meta: { title: 'Create' }
      },
      {
        path: 'dynamic/:dataKey/:id',
        name: 'dynamic-detail',
        component: () => import('@views/DynamicDetailView.vue'),
        meta: { title: 'Details' }
      },
      {
        path: 'dynamic/:dataKey/:id/edit',
        name: 'dynamic-edit',
        component: () => import('@views/DynamicFormView.vue'),
        meta: { title: 'Edit' }
      },
      {
        path: 'plugins/:pluginId',
        name: 'plugin-view',
        component: () => import('@views/PluginView.vue'),
        meta: { title: 'Plugin' }
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

// Track if plugin system has been initialized
let pluginSystemInitialized = false

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const pluginRegistryStore = usePluginRegistryStore()

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
      } catch (error) {
        // If getting user fails, redirect to login
        console.error('Failed to get current user:', error)
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
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check if user needs to change password
    if (authStore.requiresPasswordChange) {
      // If user needs password change but is not on set-password page, redirect
      if (to.name !== 'set-password') {
        console.log('User requires password change, redirecting to set-password')
        next({ name: 'set-password' })
        return
      }
    } else {
      // If user doesn't need password change but is trying to access set-password, redirect to dashboard
      if (to.name === 'set-password') {
        console.log('User does not require password change, redirecting to dashboard')
        next({ name: 'dashboard' })
        return
      }
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
      next({ name: 'dashboard' })
      return
    }
  }

  // Initialize plugin system once after authentication is confirmed
  if (authStore.isAuthenticated && !pluginSystemInitialized) {
    try {
      console.log('Initializing plugin system after authentication...')
      await pluginRegistryStore.initialize()
      pluginSystemInitialized = true
      console.log('Plugin system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize plugin system:', error)
      // Continue navigation even if plugin initialization fails
    }
  }

  console.log('Navigation guard allowing access to:', to.path)
  next()
})

export default router
export { routes }

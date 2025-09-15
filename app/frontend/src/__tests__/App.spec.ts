import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } }
  ]
})

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render router-view', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), mockRouter],
        stubs: {
          'router-view': { template: '<div class="router-content">Router Content</div>' }
        }
      }
    })

    expect(wrapper.find('#app').exists()).toBe(true)
    expect(wrapper.find('.router-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Router Content')
  })

  it('should have correct structure', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), mockRouter],
        stubs: { 'router-view': true }
      }
    })

    const appDiv = wrapper.find('#app')
    expect(appDiv.exists()).toBe(true)
    expect(appDiv.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })

  it('should mount without errors', () => {
    expect(() => {
      mount(App, {
        global: {
          plugins: [createPinia(), mockRouter],
          stubs: { 'router-view': true }
        }
      })
    }).not.toThrow()
  })
})

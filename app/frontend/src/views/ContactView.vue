<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900">Contact Us</h1>
      <p class="mt-1 text-gray-600">
        Get in touch with your investment team or support
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Contact Form -->
      <div class="bg-white rounded-lg shadow-soft border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Send a Message</h2>
        </div>

        <form @submit.prevent="sendMessage" class="p-6 space-y-6">
          <!-- Subject -->
          <div>
            <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="subject"
              v-model="form.subject"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a subject</option>
              <option value="general">General Inquiry</option>
              <option value="portfolio">Portfolio Question</option>
              <option value="documents">Document Request</option>
              <option value="technical">Technical Support</option>
              <option value="meeting">Schedule Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Message -->
          <div>
            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              v-model="form.message"
              rows="6"
              required
              placeholder="Please describe your inquiry or question..."
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              {{ form.message.length }}/1000 characters
            </p>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div class="flex space-x-4">
              <label
                v-for="priority in priorities"
                :key="priority.value"
                class="flex items-center"
              >
                <input
                  v-model="form.priority"
                  :value="priority.value"
                  type="radio"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700">{{ priority.label }}</span>
              </label>
            </div>
          </div>

          <!-- Attachments -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Attachments (optional)
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                @change="handleFileUpload"
                class="hidden"
                ref="fileInput"
              />
              <i class="pi pi-cloud-upload text-3xl text-gray-400 mb-2"></i>
              <p class="text-sm text-gray-600 mb-2">
                Drop files here or
                <button
                  type="button"
                  @click="() => fileInput?.click()"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p class="text-xs text-gray-500">
                PDF, DOC, XLS, PNG, JPG up to 10MB each
              </p>
            </div>

            <!-- File List -->
            <div v-if="attachedFiles.length > 0" class="mt-3 space-y-2">
              <div
                v-for="(file, index) in attachedFiles"
                :key="index"
                class="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div class="flex items-center space-x-2">
                  <i class="pi pi-file text-gray-400"></i>
                  <span class="text-sm text-gray-700">{{ file.name }}</span>
                  <span class="text-xs text-gray-500">({{ formatFileSize(file.size) }})</span>
                </div>
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-500">
              We'll respond within 1-2 business days
            </p>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex items-center px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              <span v-if="!isLoading" class="flex items-center">
                <i class="pi pi-send mr-2"></i>
                Send Message
              </span>
              <span v-else class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Contact Information -->
      <div class="space-y-6">
        <!-- Team Contacts -->
        <div class="bg-white rounded-lg shadow-soft border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Your Investment Team</h2>
          </div>
          <div class="p-6 space-y-4">
            <div
              v-for="contact in teamContacts"
              :key="contact.id"
              class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <span class="text-white font-semibold">{{ contact.initials }}</span>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900">{{ contact.name }}</h3>
                <p class="text-sm text-gray-600">{{ contact.role }}</p>
                <div class="mt-2 space-y-1">
                  <a
                    :href="`mailto:${contact.email}`"
                    class="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <i class="pi pi-envelope mr-2"></i>
                    {{ contact.email }}
                  </a>
                  <a
                    :href="`tel:${contact.phone}`"
                    class="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <i class="pi pi-phone mr-2"></i>
                    {{ contact.phone }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Office Information -->
        <div class="bg-white rounded-lg shadow-soft border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Office Information</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-start space-x-3">
              <i class="pi pi-map-marker text-primary-600 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">Address</p>
                <p class="text-sm text-gray-600">
                  123 Investment Street<br>
                  Suite 400<br>
                  New York, NY 10001
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <i class="pi pi-phone text-primary-600 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">Main Office</p>
                <p class="text-sm text-gray-600">(555) 123-4567</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <i class="pi pi-clock text-primary-600 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">Business Hours</p>
                <p class="text-sm text-gray-600">
                  Monday - Friday: 9:00 AM - 6:00 PM ET<br>
                  Saturday: 10:00 AM - 2:00 PM ET<br>
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-soft border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div class="p-6 space-y-3">
            <button
              v-for="action in quickActions"
              :key="action.id"
              @click="handleQuickAction(action.id)"
              class="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div :class="['flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3', action.iconBg]">
                <i :class="[action.icon, action.iconColor]"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ action.title }}</p>
                <p class="text-xs text-gray-500">{{ action.description }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" :class="[
      'rounded-lg border p-4',
      message.type === 'success'
        ? 'bg-success-50 border-success-200 text-success-800'
        : 'bg-error-50 border-error-200 text-error-800'
    ]">
      <div class="flex">
        <div class="flex-shrink-0">
          <i :class="[
            'text-lg',
            message.type === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'
          ]"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ message.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
const attachedFiles = ref<File[]>([])
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const fileInput = ref<HTMLInputElement>()

const form = ref({
  subject: '',
  message: '',
  priority: 'normal'
})

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

const teamContacts = ref([
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Investment Manager',
    email: 'sarah.johnson@pefund.com',
    phone: '(555) 123-4567',
    initials: 'SJ'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Portfolio Analyst',
    email: 'michael.chen@pefund.com',
    phone: '(555) 123-4568',
    initials: 'MC'
  },
  {
    id: 3,
    name: 'Emily Davis',
    role: 'Client Relations Manager',
    email: 'emily.davis@pefund.com',
    phone: '(555) 123-4569',
    initials: 'ED'
  }
])

const quickActions = ref([
  {
    id: 'schedule-call',
    title: 'Schedule a Call',
    description: 'Book a meeting with your investment team',
    icon: 'pi pi-calendar',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100'
  },
  {
    id: 'document-request',
    title: 'Request Documents',
    description: 'Request specific investment documents',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  },
  {
    id: 'technical-support',
    title: 'Technical Support',
    description: 'Get help with platform issues',
    icon: 'pi pi-cog',
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100'
  },
  {
    id: 'feedback',
    title: 'Provide Feedback',
    description: 'Share your thoughts on our service',
    icon: 'pi pi-comment',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  }
])

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    attachedFiles.value.push(...newFiles)
  }
}

const removeFile = (index: number) => {
  attachedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const sendMessage = async () => {
  try {
    isLoading.value = true
    message.value = null

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // In a real app, you would send the message to the backend
    console.log('Sending message:', {
      ...form.value,
      attachments: attachedFiles.value.map(f => f.name)
    })

    message.value = {
      type: 'success',
      text: 'Your message has been sent successfully! We\'ll respond within 1-2 business days.'
    }

    // Reset form
    form.value = {
      subject: '',
      message: '',
      priority: 'normal'
    }
    attachedFiles.value = []

    // Clear success message after 5 seconds
    setTimeout(() => {
      message.value = null
    }, 5000)

  } catch (error) {
    message.value = {
      type: 'error',
      text: 'Failed to send message. Please try again or contact us directly.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleQuickAction = (actionId: string) => {
  switch (actionId) {
    case 'schedule-call':
      form.value.subject = 'meeting'
      form.value.message = 'I would like to schedule a call to discuss my portfolio.'
      break
    case 'document-request':
      form.value.subject = 'documents'
      form.value.message = 'I would like to request specific documents related to my investments.'
      break
    case 'technical-support':
      form.value.subject = 'technical'
      form.value.message = 'I am experiencing technical issues with the platform.'
      break
    case 'feedback':
      form.value.subject = 'general'
      form.value.message = 'I would like to provide feedback about your service.'
      break
    default:
      console.log('Unknown action:', actionId)
  }
}
</script>
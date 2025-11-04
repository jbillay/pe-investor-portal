<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :style="{ width: '95vw', maxWidth: '1400px' }"
    class="email-template-preview-dialog"
    @hide="onDialogHide"
  >
    <div v-if="template" class="preview-container">
      <!-- Template Info Header -->
      <div class="template-info-header">
        <div class="flex items-center gap-3 mb-3">
          <div class="template-icon">
            <i class="pi pi-envelope text-2xl text-blue-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 mb-1">{{ template.displayName }}</h3>
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <span class="flex items-center gap-1">
                <i class="pi pi-tag"></i>
                <Tag :severity="getCategorySeverity(template.category)">{{ template.category }}</Tag>
              </span>
              <span class="flex items-center gap-1">
                <i class="pi pi-circle-fill" :class="template.isActive ? 'text-green-500' : 'text-red-500'"></i>
                {{ template.isActive ? 'Active' : 'Inactive' }}
              </span>
              <Tag v-if="template.isSystem" severity="info" value="System Template" />
              <span class="flex items-center gap-1">
                <i class="pi pi-code"></i>
                Version {{ template.version }}
              </span>
            </div>
          </div>
        </div>

        <!-- Template Description -->
        <div v-if="template.description" class="template-description">
          <p class="text-gray-700">{{ template.description }}</p>
        </div>
      </div>

      <Divider />

      <!-- Main Content Area -->
      <div class="preview-content">
        <!-- Left Panel: Variables Input -->
        <div class="variables-panel">
          <div class="panel-header">
            <h4 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-sliders-h"></i>
              Template Variables
            </h4>
            <p class="text-sm text-gray-600 mt-1">
              {{ template.variables.length }} variable(s) defined
            </p>
          </div>

          <div class="variables-content">
            <div v-if="template.variables.length > 0" class="space-y-4">
              <div v-for="variable in template.variables" :key="variable.name" class="variable-field">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ variable.name }}
                  <span v-if="variable.required" class="text-red-500">*</span>
                  <i v-if="variable.description"
                     class="pi pi-info-circle text-xs text-gray-400 ml-1"
                     v-tooltip.right="variable.description"
                  ></i>
                </label>

                <!-- String input -->
                <InputText
                  v-if="variable.type === 'string'"
                  v-model="variableValues[variable.name]"
                  :placeholder="variable.example ? String(variable.example) : `Enter ${variable.name}`"
                  class="w-full"
                  @input="debouncedPreview"
                />

                <!-- Number input -->
                <InputNumber
                  v-else-if="variable.type === 'number'"
                  v-model="variableValues[variable.name]"
                  :placeholder="variable.example ? String(variable.example) : `Enter ${variable.name}`"
                  class="w-full"
                  @input="debouncedPreview"
                />

                <!-- Date input -->
                <InputText
                  v-else-if="variable.type === 'date'"
                  v-model="variableValues[variable.name]"
                  type="date"
                  :placeholder="variable.example ? String(variable.example) : `Enter ${variable.name}`"
                  class="w-full"
                  @input="debouncedPreview"
                />

                <!-- Currency input -->
                <InputNumber
                  v-else-if="variable.type === 'currency'"
                  v-model="variableValues[variable.name]"
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  :placeholder="variable.example ? String(variable.example) : `Enter ${variable.name}`"
                  class="w-full"
                  @input="debouncedPreview"
                />

                <!-- Boolean toggle -->
                <ToggleSwitch
                  v-else-if="variable.type === 'boolean'"
                  v-model="variableValues[variable.name]"
                  @change="debouncedPreview"
                />

                <!-- Fallback text input -->
                <InputText
                  v-else
                  v-model="variableValues[variable.name]"
                  :placeholder="variable.example ? String(variable.example) : `Enter ${variable.name}`"
                  class="w-full"
                  @input="debouncedPreview"
                />

                <small v-if="variable.example" class="text-gray-500">
                  Example: {{ variable.example }}
                </small>
              </div>

              <div class="action-buttons">
                <Button
                  label="Use Example Values"
                  icon="pi pi-sync"
                  class="p-button-outlined p-button-sm w-full"
                  @click="fillExampleValues"
                />
                <Button
                  label="Clear All"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-secondary p-button-sm w-full"
                  @click="clearVariableValues"
                />
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <i class="pi pi-info-circle text-3xl mb-2"></i>
              <p>No variables defined for this template</p>
            </div>
          </div>
        </div>

        <!-- Right Panel: Preview Display -->
        <div class="preview-panel">
          <Tabs v-model:value="activePreviewTab" class="preview-tabs">
            <TabList>
              <Tab value="0">
                <div class="flex items-center gap-2">
                  <i class="pi pi-code"></i>
                  <span>HTML Preview</span>
                </div>
              </Tab>
              <Tab value="1">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file"></i>
                  <span>Plain Text</span>
                </div>
              </Tab>
              <Tab value="2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file-edit"></i>
                  <span>Template Source</span>
                </div>
              </Tab>
            </TabList>

            <TabPanels>
              <!-- HTML Preview Tab -->
              <TabPanel value="0">
                <div class="preview-section">
                  <!-- Subject Preview -->
                  <div class="subject-preview mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                    <div class="subject-display">
                      <i class="pi pi-envelope text-gray-400"></i>
                      <span class="font-medium">{{ renderedSubject || template.subject }}</span>
                    </div>
                  </div>

                  <!-- HTML Body Preview -->
                  <div class="html-preview">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Body (HTML)</label>
                    <div v-if="previewLoading" class="preview-loading">
                      <ProgressSpinner style="width: 50px; height: 50px" />
                      <p class="text-gray-600 mt-2">Rendering preview...</p>
                    </div>
                    <div v-else class="html-preview-container">
                      <iframe
                        ref="htmlPreviewFrame"
                        :srcdoc="displayHtmlBody"
                        class="html-preview-iframe"
                        sandbox="allow-same-origin"
                        @load="onIframeLoad"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <!-- Plain Text Preview Tab -->
              <TabPanel value="1">
                <div class="preview-section">
                  <!-- Subject Preview -->
                  <div class="subject-preview mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                    <div class="subject-display">
                      <i class="pi pi-envelope text-gray-400"></i>
                      <span class="font-medium">{{ renderedSubject || template.subject }}</span>
                    </div>
                  </div>

                  <!-- Text Body Preview -->
                  <div class="text-preview">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Body (Plain Text)</label>
                    <Textarea
                      v-model="displayTextBody"
                      :autoResize="true"
                      rows="15"
                      class="w-full font-mono text-sm"
                      readonly
                    />
                  </div>
                </div>
              </TabPanel>

              <!-- Template Source Tab -->
              <TabPanel value="2">
                <div class="preview-section">
                  <Accordion :value="['0']" multiple>
                    <AccordionPanel value="0">
                      <AccordionHeader>HTML Source</AccordionHeader>
                      <AccordionContent>
                        <div class="source-code">
                          <Textarea
                            v-model="template.htmlBody"
                            :autoResize="true"
                            rows="10"
                            class="w-full font-mono text-xs"
                            readonly
                          />
                        </div>
                      </AccordionContent>
                    </AccordionPanel>
                    <AccordionPanel value="1">
                      <AccordionHeader>Plain Text Source</AccordionHeader>
                      <AccordionContent>
                        <div class="source-code">
                          <Textarea
                            v-model="template.textBody"
                            :autoResize="true"
                            rows="10"
                            class="w-full font-mono text-xs"
                            readonly
                          />
                        </div>
                      </AccordionContent>
                    </AccordionPanel>
                    <AccordionPanel value="2">
                      <AccordionHeader>Subject Template</AccordionHeader>
                      <AccordionContent>
                        <div class="source-code">
                          <InputText
                            v-model="template.subject"
                            class="w-full font-mono text-sm"
                            readonly
                          />
                        </div>
                      </AccordionContent>
                    </AccordionPanel>
                  </Accordion>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <Button
            label="Send Test Email"
            icon="pi pi-send"
            class="p-button-outlined"
            @click="showSendTestDialog"
            :disabled="!template || previewLoading"
          />
        </div>
        <div class="flex gap-2">
          <Button
            label="Close"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary"
            @click="closeDialog"
          />
          <Button
            v-if="!template?.isSystem"
            label="Edit Template"
            icon="pi pi-pencil"
            @click="editTemplate"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Send Test Email Dialog -->
  <Dialog
    v-model:visible="sendTestDialogVisible"
    header="Send Test Email"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="p-4 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Recipient Email Address</label>
        <InputText
          v-model="testEmailRecipient"
          type="email"
          placeholder="test@example.com"
          class="w-full"
        />
      </div>
      <Message v-if="sendTestError" severity="error">{{ sendTestError }}</Message>
      <Message v-if="sendTestSuccess" severity="success">Test email sent successfully!</Message>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-outlined p-button-secondary"
        @click="sendTestDialogVisible = false"
      />
      <Button
        label="Send"
        icon="pi pi-send"
        @click="sendTestEmail"
        :loading="sendingTest"
        :disabled="!testEmailRecipient || sendingTest"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useEmailTemplates } from '@/composables/useEmailTemplates';
import type { EmailTemplate, EmailCategory, TemplateVariable } from '@/types/email';

// PrimeVue Components
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import Textarea from 'primevue/textarea';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

// Props & Emits
interface Props {
  visible: boolean;
  template: EmailTemplate | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'edit': [template: EmailTemplate];
}>();

// Composables
const toast = useToast();
const { previewTemplate, sendTestEmail: sendTestEmailAction } = useEmailTemplates();

// State
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const activePreviewTab = ref('0');
const variableValues = ref<Record<string, any>>({});
const renderedSubject = ref('');
const renderedHtmlBody = ref('');
const renderedTextBody = ref('');
const previewLoading = ref(false);
const previewDebounceTimer = ref<NodeJS.Timeout | null>(null);
const htmlPreviewFrame = ref<HTMLIFrameElement | null>(null);

// Send test email state
const sendTestDialogVisible = ref(false);
const testEmailRecipient = ref('');
const sendingTest = ref(false);
const sendTestError = ref('');
const sendTestSuccess = ref(false);

// Computed
const dialogTitle = computed(() => {
  if (!props.template) return 'Template Preview';
  return `Preview: ${props.template.displayName}`;
});

const displayHtmlBody = computed(() => {
  return renderedHtmlBody.value || props.template?.htmlBody || '';
});

const displayTextBody = computed(() => {
  return renderedTextBody.value || props.template?.textBody || '';
});

// Methods
const getCategorySeverity = (category: EmailCategory): string => {
  const severityMap: Record<string, string> = {
    ACCOUNT: 'info',
    DOCUMENT: 'primary',
    CAPITAL_CALL: 'warning',
    DISTRIBUTION: 'success',
    INVESTMENT: 'info',
    SYSTEM: 'secondary',
    NOTIFICATION: 'info',
    COMPLIANCE: 'warning',
  };
  return severityMap[category] || 'info';
};

const initializeVariableValues = () => {
  if (!props.template) return;

  const values: Record<string, any> = {};
  props.template.variables.forEach((variable: TemplateVariable) => {
    if (variable.defaultValue !== undefined) {
      values[variable.name] = variable.defaultValue;
    } else if (variable.example !== undefined) {
      values[variable.name] = variable.example;
    } else {
      // Set default values based on type
      switch (variable.type) {
        case 'boolean':
          values[variable.name] = false;
          break;
        case 'number':
        case 'currency':
          values[variable.name] = 0;
          break;
        default:
          values[variable.name] = '';
      }
    }
  });
  variableValues.value = values;
};

const fillExampleValues = () => {
  if (!props.template) return;

  const values: Record<string, any> = {};
  props.template.variables.forEach((variable: TemplateVariable) => {
    if (variable.example !== undefined) {
      values[variable.name] = variable.example;
    }
  });
  variableValues.value = values;
  loadPreview();
};

const clearVariableValues = () => {
  variableValues.value = {};
  renderedSubject.value = '';
  renderedHtmlBody.value = '';
  renderedTextBody.value = '';
};

const loadPreview = async () => {
  if (!props.template) return;

  try {
    previewLoading.value = true;
    // Pass the template's variable schema for proper type conversion
    const preview = await previewTemplate(props.template.id, variableValues.value, props.template.variables);

    if (preview) {
      renderedSubject.value = preview.subject;
      renderedHtmlBody.value = preview.htmlBody;
      renderedTextBody.value = preview.textBody;
    } else {
      // If preview fails, fall back to original template
      console.warn('Preview returned null, using original template');
      renderedSubject.value = props.template.subject;
      renderedHtmlBody.value = props.template.htmlBody;
      renderedTextBody.value = props.template.textBody;
    }
  } catch (error) {
    console.error('Error loading preview:', error);
    // Fall back to original template on error
    renderedSubject.value = props.template.subject;
    renderedHtmlBody.value = props.template.htmlBody;
    renderedTextBody.value = props.template.textBody;

    toast.add({
      severity: 'warn',
      summary: 'Preview Warning',
      detail: 'Using original template. Preview rendering may require variable values.',
      life: 3000
    });
  } finally {
    previewLoading.value = false;
  }
};

const debouncedPreview = () => {
  if (previewDebounceTimer.value) {
    clearTimeout(previewDebounceTimer.value);
  }
  previewDebounceTimer.value = setTimeout(() => {
    loadPreview();
  }, 500);
};

const showSendTestDialog = () => {
  sendTestDialogVisible.value = true;
  sendTestError.value = '';
  sendTestSuccess.value = false;
};

const sendTestEmail = async () => {
  if (!props.template || !testEmailRecipient.value) return;

  try {
    sendingTest.value = true;
    sendTestError.value = '';
    sendTestSuccess.value = false;

    // Pass the template's variable schema for proper type conversion
    await sendTestEmailAction(props.template.id, testEmailRecipient.value, variableValues.value, props.template.variables);

    sendTestSuccess.value = true;
    setTimeout(() => {
      sendTestDialogVisible.value = false;
      testEmailRecipient.value = '';
    }, 2000);
  } catch (error: any) {
    sendTestError.value = error.message || 'Failed to send test email';
  } finally {
    sendingTest.value = false;
  }
};

const editTemplate = () => {
  if (props.template) {
    emit('edit', props.template);
    closeDialog();
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogHide = () => {
  // Reset state when dialog closes
  activePreviewTab.value = '0';
  clearVariableValues();
};

const onIframeLoad = () => {
  // Iframe loaded successfully
  if (htmlPreviewFrame.value?.contentWindow) {
    // You can add any post-load processing here if needed
    console.log('HTML preview loaded');
  }
};

// Watch for template changes
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    initializeVariableValues();
    loadPreview();
  }
}, { immediate: true });

// Initialize on mount
onMounted(() => {
  if (props.template) {
    initializeVariableValues();
    loadPreview();
  }
});
</script>

<style scoped>
.preview-container {
  padding: 0;
}

.template-info-header {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.template-icon {
  width: 3rem;
  height: 3rem;
  background: #eff6ff;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-description {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.preview-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  min-height: 600px;
}

.variables-panel {
  border-right: 1px solid #e5e7eb;
  padding-right: 1.5rem;
}

.panel-header {
  margin-bottom: 1.5rem;
}

.variables-content {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.variable-field {
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.preview-panel {
  overflow: hidden;
}

.preview-tabs :deep(.p-tabpanels) {
  padding: 1rem 0;
}

.preview-tabs :deep(.p-tablist) {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
}

.preview-section {
  max-height: 600px;
  overflow-y: auto;
}

.subject-preview {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
}

.subject-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.html-preview,
.text-preview {
  margin-top: 1rem;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.html-preview-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
}

.html-preview-iframe {
  width: 100%;
  min-height: 500px;
  max-height: 600px;
  border: none;
  display: block;
  background: white;
}

.source-code {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
}

/* Scrollbar styling */
.variables-content::-webkit-scrollbar,
.preview-section::-webkit-scrollbar {
  width: 8px;
}

.variables-content::-webkit-scrollbar-track,
.preview-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.variables-content::-webkit-scrollbar-thumb,
.preview-section::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.variables-content::-webkit-scrollbar-thumb:hover,
.preview-section::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

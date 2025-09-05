<template>
  <div class="if-widget" :class="widgetClasses">
    <!-- Trigger Button -->
    <button
      v-if="showTrigger && !isModalOpen"
      class="if-widget-trigger"
      :class="triggerClasses"
      :disabled="disabled"
      @click="openModal"
      type="button"
      :aria-label="triggerText"
    >
      <span class="if-trigger-icon">{{ triggerIcon }}</span>
      <span class="if-trigger-text">{{ triggerText }}</span>
    </button>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <Transition name="if-fade">
        <div
          v-if="isModalOpen"
          class="if-widget-overlay"
          @click="handleOverlayClick"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="modalTitleId"
        >
          <div class="if-widget-modal" :class="modalClasses" @click.stop>
            <!-- Modal Header -->
            <header class="if-modal-header">
              <h2 :id="modalTitleId" class="if-modal-title">{{ modalTitle }}</h2>
              <button
                class="if-modal-close"
                @click="closeModal"
                aria-label="Close feedback form"
                type="button"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </header>

            <!-- Modal Body -->
            <div class="if-modal-body">
              <!-- Loading State -->
              <div v-if="isSubmitting || isLoading" class="if-loading">
                <div class="if-spinner"></div>
                <p>{{ loadingText }}</p>
              </div>

              <!-- Error State -->
              <div v-else-if="submissionError" class="if-error">
                <div class="if-error-icon">⚠️</div>
                <div class="if-error-content">
                  <h3>Something went wrong</h3>
                  <p>{{ submissionError.message }}</p>
                  <button class="if-retry-btn" @click="clearSubmissionError" type="button">
                    Try Again
                  </button>
                </div>
              </div>

              <!-- Success State -->
              <div v-else-if="isSuccess" class="if-success">
                <div class="if-success-icon">✅</div>
                <div class="if-success-content">
                  <h3>Thank you!</h3>
                  <p>{{ successMessage }}</p>
                  <button class="if-success-btn" @click="resetForm" type="button">
                    Send Another
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form
                v-else
                @submit.prevent="handleSubmit"
                class="if-feedback-form"
              >
                <!-- Issue Type -->
                <div class="if-field-group">
                  <label for="issueType" class="if-label">Type</label>
                  <select
                    id="issueType"
                    v-model="formData.type"
                    class="if-select"
                    required
                  >
                    <option value="feedback">General Feedback</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="question">Question</option>
                  </select>
                </div>

                <!-- Priority -->
                <div v-if="showPriority" class="if-field-group">
                  <label for="priority" class="if-label">Priority</label>
                  <select
                    id="priority"
                    v-model="formData.priority"
                    class="if-select"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <!-- Title -->
                <div class="if-field-group">
                  <label for="title" class="if-label">Title *</label>
                  <input
                    id="title"
                    v-model="formData.title"
                    type="text"
                    class="if-input"
                    placeholder="Brief description of your feedback"
                    required
                    minlength="3"
                    maxlength="200"
                  />
                  <div v-if="errors.title" class="if-field-error">
                    {{ errors.title }}
                  </div>
                </div>

                <!-- Description -->
                <div class="if-field-group">
                  <label for="description" class="if-label">Description *</label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    class="if-textarea"
                    placeholder="Please provide detailed information..."
                    rows="4"
                    required
                    minlength="10"
                    maxlength="5000"
                  ></textarea>
                  <div v-if="errors.description" class="if-field-error">
                    {{ errors.description }}
                  </div>
                </div>

                <!-- Email (if required) -->
                <div v-if="requireEmail" class="if-field-group">
                  <label for="email" class="if-label">Email *</label>
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="if-input"
                    placeholder="your@email.com"
                    :required="requireEmail"
                  />
                  <div v-if="errors.email" class="if-field-error">
                    {{ errors.email }}
                  </div>
                </div>

                <!-- File Attachments (premium feature) -->
                <div v-if="allowFileUploads" class="if-field-group">
                  <label class="if-label">Attachments</label>
                  <div class="if-file-upload">
                    <input
                      ref="fileInput"
                      type="file"
                      multiple
                      @change="handleFileSelect"
                      class="if-file-input"
                      :accept="allowedFileTypes?.join(',')"
                    />
                    <button
                      type="button"
                      class="if-file-button"
                      @click="$refs.fileInput?.click()"
                    >
                      Choose Files
                    </button>
                    <div v-if="selectedFiles.length > 0" class="if-file-list">
                      <div v-for="file in selectedFiles" :key="file.name" class="if-file-item">
                        <span class="if-file-name">{{ file.name }}</span>
                        <button
                          type="button"
                          class="if-file-remove"
                          @click="removeFile(file)"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Custom Fields -->
                <div v-for="field in customFields" :key="field.name" class="if-field-group">
                  <label :for="field.name" class="if-label">
                    {{ field.label }}
                    <span v-if="field.required">*</span>
                  </label>
                  
                  <!-- Text Input -->
                  <input
                    v-if="field.type === 'text' || field.type === 'email'"
                    :id="field.name"
                    v-model="formData.custom[field.name]"
                    :type="field.type"
                    class="if-input"
                    :placeholder="field.placeholder"
                    :required="field.required"
                  />
                  
                  <!-- Textarea -->
                  <textarea
                    v-else-if="field.type === 'textarea'"
                    :id="field.name"
                    v-model="formData.custom[field.name]"
                    class="if-textarea"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    rows="3"
                  ></textarea>
                  
                  <!-- Select -->
                  <select
                    v-else-if="field.type === 'select'"
                    :id="field.name"
                    v-model="formData.custom[field.name]"
                    class="if-select"
                    :required="field.required"
                  >
                    <option value="">Select...</option>
                    <option v-for="option in field.options" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  
                  <!-- Checkbox -->
                  <div v-else-if="field.type === 'checkbox'" class="if-checkbox-group">
                    <input
                      :id="field.name"
                      v-model="formData.custom[field.name]"
                      type="checkbox"
                      class="if-checkbox"
                    />
                    <label :for="field.name" class="if-checkbox-label">
                      {{ field.placeholder || field.label }}
                    </label>
                  </div>
                </div>

                <!-- Actions -->
                <div class="if-form-actions">
                  <button
                    type="button"
                    class="if-btn if-btn-secondary"
                    @click="closeModal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="if-btn if-btn-primary"
                    :disabled="!isFormValid || isSubmitting"
                  >
                    {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Modal Footer -->
            <footer class="if-modal-footer">
              <p class="if-powered-by">
                Powered by <a href="https://issueflow.dev" target="_blank">IssueFlow</a>
              </p>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive, inject } from 'vue';
import { useIssueFlow } from '../composables/useIssueFlow';
import type { 
  IssueFlowConfig,
  IssueFlowWidgetProps,
  IssueFlowWidgetEmits,
  Issue,
  IssueType,
  IssuePriority,
  FormField
} from '../types';

// Props
const props = withDefaults(defineProps<IssueFlowWidgetProps>(), {
  position: 'bottom-right',
  triggerText: 'Feedback',
  disabled: false,
  hidden: false,
  showTrigger: true,
  autoOpen: false,
  autoClose: true,
  autoCloseDelay: 3000,
});

// Emits
const emit = defineEmits<IssueFlowWidgetEmits>();

// Composable
const { 
  config,
  isLoading,
  error,
  initialize,
  submitIssue,
  isOpen: globalIsOpen
} = useIssueFlow();

// State
const isModalOpen = ref(false);
const isSubmitting = ref(false);
const isSuccess = ref(false);
const submissionError = ref<Error | null>(null);
const selectedFiles = ref<File[]>([]);

// Form data
const formData = reactive({
  type: 'feedback' as IssueType,
  priority: 'medium' as IssuePriority,
  title: '',
  description: '',
  email: '',
  custom: {} as Record<string, any>,
});

// Validation errors
const errors = reactive({
  title: '',
  description: '',
  email: '',
});

// File input ref
const fileInput = ref<HTMLInputElement>();

// Configuration
const currentConfig = computed(() => props.config || config.value);
const requireEmail = computed(() => currentConfig.value?.behavior?.requireEmail || false);
const allowFileUploads = computed(() => currentConfig.value?.behavior?.allowFileUploads || false);
const allowedFileTypes = computed(() => currentConfig.value?.behavior?.allowedFileTypes || []);
const maxAttachmentSize = computed(() => currentConfig.value?.behavior?.maxAttachmentSize || 5 * 1024 * 1024);
const showPriority = computed(() => props.showPriority !== false);
const customFields = computed(() => props.customFields || []);

// UI Text
const triggerIcon = computed(() => '💬');
const modalTitle = computed(() => 'Send Feedback');
const loadingText = computed(() => 'Sending your feedback...');
const successMessage = computed(() => 'Your feedback has been sent successfully!');
const modalTitleId = `if-modal-title-${Math.random().toString(36).substr(2, 9)}`;

// Classes
const widgetClasses = computed(() => [
  `if-position-${props.position}`,
  props.class,
  props.disabled && 'if-disabled',
  props.hidden && 'if-hidden',
].filter(Boolean));

const triggerClasses = computed(() => [
  `if-position-${props.position}`,
  props.disabled && 'if-disabled',
].filter(Boolean));

const modalClasses = computed(() => [
  `if-theme-${props.theme?.mode || currentConfig.value?.theme?.mode || 'auto'}`,
].filter(Boolean));

// Form validation
const isFormValid = computed(() => {
  return formData.title.length >= 3 &&
         formData.description.length >= 10 &&
         (!requireEmail.value || isValidEmail(formData.email));
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Methods
function openModal(): void {
  if (props.disabled) return;
  
  isModalOpen.value = true;
  resetFormState();
  emit('widget-opened');
  
  // Focus first input after a tick
  setTimeout(() => {
    const firstInput = document.querySelector('.if-feedback-form .if-input') as HTMLInputElement;
    firstInput?.focus();
  }, 100);
}

function closeModal(): void {
  isModalOpen.value = false;
  emit('widget-closed');
}

function handleOverlayClick(event: MouseEvent): void {
  // Close when clicking overlay (not modal content)
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

async function handleSubmit(): Promise<void> {
  if (!isFormValid.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  clearSubmissionError();

  try {
    const issueData: Partial<Issue> = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      metadata: {
        source: 'vue-widget',
        email: formData.email || undefined,
        customFields: formData.custom,
        attachments: selectedFiles.value.map(f => f.name),
      },
    };

    const result = await submitIssue(issueData);
    
    isSuccess.value = true;
    emit('issue-submitted', result);

    // Auto-close after delay if configured
    if (props.autoClose) {
      setTimeout(() => {
        closeModal();
      }, props.autoCloseDelay);
    }

  } catch (error) {
    submissionError.value = error instanceof Error ? error : new Error('Failed to submit feedback');
    emit('error', submissionError.value);
  } finally {
    isSubmitting.value = false;
  }
}

function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const newFiles = Array.from(target.files);
    
    // Validate file size
    for (const file of newFiles) {
      if (file.size > maxAttachmentSize.value) {
        alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxAttachmentSize.value)}`);
        return;
      }
    }
    
    selectedFiles.value = [...selectedFiles.value, ...newFiles];
  }
}

function removeFile(file: File): void {
  selectedFiles.value = selectedFiles.value.filter(f => f !== file);
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function resetForm(): void {
  formData.type = 'feedback';
  formData.priority = 'medium';
  formData.title = '';
  formData.description = '';
  formData.email = '';
  formData.custom = {};
  selectedFiles.value = [];
  isSuccess.value = false;
  clearValidationErrors();
}

function resetFormState(): void {
  isSubmitting.value = false;
  isSuccess.value = false;
  clearSubmissionError();
  
  if (!isModalOpen.value) {
    resetForm();
  }
}

function clearSubmissionError(): void {
  submissionError.value = null;
}

function clearValidationErrors(): void {
  errors.title = '';
  errors.description = '';
  errors.email = '';
}

// Handle escape key
function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isModalOpen.value) {
    closeModal();
  }
}

// Initialize on mount if config provided
onMounted(async () => {
  if (props.config) {
    await initialize(props.config);
    
    if (props.config) {
      emit('config-changed', props.config);
    }
  }
  
  if (props.autoOpen) {
    openModal();
  }
  
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
});

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    initialize(newConfig);
    emit('config-changed', newConfig);
  }
});

// Sync with global open state
watch(globalIsOpen, (open) => {
  if (open && !isModalOpen.value) {
    openModal();
  } else if (!open && isModalOpen.value) {
    closeModal();
  }
});

// Expose methods for parent component
defineExpose({
  open: openModal,
  close: closeModal,
  submit: handleSubmit,
  reset: resetForm,
});
</script>

<style scoped>
@import '../styles/widget.css';
</style>
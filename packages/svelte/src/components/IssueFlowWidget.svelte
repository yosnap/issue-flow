<script lang="ts">
  /**
   * @fileoverview IssueFlow Widget Component for Svelte
   * 
   * Main widget component that provides a complete feedback collection interface
   * using Svelte's reactive patterns and component lifecycle.
   */

  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { getIssueFlowStore } from '../stores/issueflow.js';
  import { 
    clickOutside, 
    escapeKey, 
    focusTrap, 
    portal, 
    autoResize 
  } from '../lib/actions.js';
  import type {
    IssueFlowConfig,
    IssueFlowWidgetProps,
    Issue,
    IssueType,
    IssuePriority,
    FormField,
    IssueSubmissionResult,
  } from '../types/index.js';

  // Props
  export let config: IssueFlowConfig | undefined = undefined;
  export let position: IssueFlowWidgetProps['position'] = 'bottom-right';
  export let triggerText: string = 'Feedback';
  export let disabled: boolean = false;
  export let hidden: boolean = false;
  export let theme: any = undefined;
  export let showTrigger: boolean = true;
  export let autoOpen: boolean = false;
  export let autoClose: boolean = true;
  export let autoCloseDelay: number = 3000;
  export let customFields: FormField[] = [];
  export let showPriority: boolean = true;
  export let requireEmail: boolean = false;
  export let allowFileUploads: boolean = false;

  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    'issue-submitted': { result: IssueSubmissionResult };
    'widget-opened': {};
    'widget-closed': {};
    error: { error: Error };
  }>();

  // Get IssueFlow store
  const store = getIssueFlowStore({ config });
  const { 
    config: storeConfig, 
    loading, 
    error: storeError, 
    initialize, 
    submitIssue, 
    openWidget,
    closeWidget,
    isOpen 
  } = store;

  // Local state
  let isModalOpen = false;
  let isSubmitting = false;
  let isSuccess = false;
  let submissionError: Error | null = null;
  let selectedFiles: File[] = [];
  let fileInput: HTMLInputElement;
  let isMounted = false;

  // Form data
  let formData = {
    type: 'feedback' as IssueType,
    priority: 'medium' as IssuePriority,
    title: '',
    description: '',
    email: '',
    custom: {} as Record<string, any>,
  };

  // Validation errors
  let errors = {
    title: '',
    description: '',
    email: '',
  };

  // Reactive statements
  $: currentConfig = config || $storeConfig;
  $: actualRequireEmail = requireEmail || currentConfig?.behavior?.requireEmail || false;
  $: actualAllowFileUploads = allowFileUploads || currentConfig?.behavior?.allowFileUploads || false;
  $: allowedFileTypes = currentConfig?.behavior?.allowedFileTypes || [];
  $: maxAttachmentSize = currentConfig?.behavior?.maxAttachmentSize || 5 * 1024 * 1024;

  // Form validation
  $: isFormValid = 
    formData.title.length >= 3 &&
    formData.description.length >= 10 &&
    (!actualRequireEmail || isValidEmail(formData.email));

  // Sync with global open state
  $: if ($isOpen && !isModalOpen) {
    openModal();
  } else if (!$isOpen && isModalOpen) {
    closeModal();
  }

  // Watch for store errors
  $: if ($storeError) {
    submissionError = $storeError;
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function openModal(): void {
    if (disabled) return;
    
    isModalOpen = true;
    resetFormState();
    openWidget();
    dispatch('widget-opened');
  }

  function closeModal(): void {
    isModalOpen = false;
    closeWidget();
    dispatch('widget-closed');
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    
    if (!isFormValid || isSubmitting) {
      return;
    }

    isSubmitting = true;
    clearSubmissionError();

    try {
      const issueData: Partial<Issue> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        metadata: {
          source: 'svelte-widget',
          email: formData.email || undefined,
          customFields: formData.custom,
          attachments: selectedFiles.map(f => f.name),
        },
      };

      const result = await submitIssue(issueData);
      
      isSuccess = true;
      dispatch('issue-submitted', { result });

      // Auto-close after delay if configured
      if (autoClose) {
        setTimeout(() => {
          closeModal();
        }, autoCloseDelay);
      }

    } catch (error) {
      submissionError = error instanceof Error ? error : new Error('Failed to submit feedback');
      dispatch('error', { error: submissionError });
    } finally {
      isSubmitting = false;
    }
  }

  function handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      
      // Validate file size
      for (const file of newFiles) {
        if (file.size > maxAttachmentSize) {
          alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxAttachmentSize)}`);
          return;
        }
      }
      
      selectedFiles = [...selectedFiles, ...newFiles];
    }
  }

  function removeFile(file: File): void {
    selectedFiles = selectedFiles.filter(f => f !== file);
  }

  function formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  function resetForm(): void {
    formData = {
      type: 'feedback',
      priority: 'medium',
      title: '',
      description: '',
      email: '',
      custom: {},
    };
    selectedFiles = [];
    isSuccess = false;
    clearValidationErrors();
  }

  function resetFormState(): void {
    isSubmitting = false;
    isSuccess = false;
    clearSubmissionError();
    
    if (!isModalOpen) {
      resetForm();
    }
  }

  function clearSubmissionError(): void {
    submissionError = null;
  }

  function clearValidationErrors(): void {
    errors = {
      title: '',
      description: '',
      email: '',
    };
  }

  function handleCustomFieldChange(fieldName: string, value: any): void {
    formData.custom = {
      ...formData.custom,
      [fieldName]: value,
    };
  }

  // Initialize if config provided
  onMount(async () => {
    isMounted = true;
    
    if (config) {
      await initialize(config);
    }
    
    if (autoOpen) {
      openModal();
    }
  });

  onDestroy(() => {
    // Cleanup if needed
  });
</script>

<!-- CSS for styling -->
<svelte:head>
  <style>
    @import '../styles/widget.css';
  </style>
</svelte:head>

{#if isMounted && !hidden}
  <div class="if-widget if-position-{position} {disabled ? 'if-disabled' : ''}">
    <!-- Trigger Button -->
    {#if showTrigger && !isModalOpen}
      <button
        class="if-widget-trigger if-position-{position} {disabled ? 'if-disabled' : ''}"
        {disabled}
        on:click={openModal}
        type="button"
        aria-label={triggerText}
      >
        <span class="if-trigger-icon">💬</span>
        <span class="if-trigger-text">{triggerText}</span>
      </button>
    {/if}

    <!-- Modal -->
    {#if isModalOpen}
      <div 
        class="if-widget-overlay" 
        transition:fade={{ duration: 300 }}
        use:portal={'body'}
        use:clickOutside={closeModal}
        use:escapeKey={closeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          class="if-widget-modal" 
          transition:scale={{ duration: 300, start: 0.95 }}
          use:focusTrap
          on:click|stopPropagation
        >
          <!-- Modal Header -->
          <header class="if-modal-header">
            <h2 id="modal-title" class="if-modal-title">Send Feedback</h2>
            <button
              class="if-modal-close"
              on:click={closeModal}
              aria-label="Close feedback form"
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <!-- Modal Body -->
          <div class="if-modal-body">
            <!-- Loading State -->
            {#if isSubmitting || $loading}
              <div class="if-loading">
                <div class="if-spinner"></div>
                <p>Sending your feedback...</p>
              </div>
            
            <!-- Error State -->
            {:else if submissionError}
              <div class="if-error">
                <div class="if-error-icon">⚠️</div>
                <div class="if-error-content">
                  <h3>Something went wrong</h3>
                  <p>{submissionError.message}</p>
                  <button 
                    class="if-retry-btn" 
                    on:click={clearSubmissionError} 
                    type="button"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            
            <!-- Success State -->
            {:else if isSuccess}
              <div class="if-success">
                <div class="if-success-icon">✅</div>
                <div class="if-success-content">
                  <h3>Thank you!</h3>
                  <p>Your feedback has been sent successfully!</p>
                  <button 
                    class="if-success-btn" 
                    on:click={resetForm} 
                    type="button"
                  >
                    Send Another
                  </button>
                </div>
              </div>
            
            <!-- Form -->
            {:else}
              <form on:submit={handleSubmit} class="if-feedback-form">
                <!-- Issue Type -->
                <div class="if-field-group">
                  <label for="issueType" class="if-label">Type</label>
                  <select
                    id="issueType"
                    bind:value={formData.type}
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
                {#if showPriority}
                  <div class="if-field-group">
                    <label for="priority" class="if-label">Priority</label>
                    <select
                      id="priority"
                      bind:value={formData.priority}
                      class="if-select"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                {/if}

                <!-- Title -->
                <div class="if-field-group">
                  <label for="title" class="if-label">Title *</label>
                  <input
                    id="title"
                    bind:value={formData.title}
                    type="text"
                    class="if-input"
                    placeholder="Brief description of your feedback"
                    required
                    minlength="3"
                    maxlength="200"
                  />
                  {#if errors.title}
                    <div class="if-field-error">{errors.title}</div>
                  {/if}
                </div>

                <!-- Description -->
                <div class="if-field-group">
                  <label for="description" class="if-label">Description *</label>
                  <textarea
                    id="description"
                    bind:value={formData.description}
                    class="if-textarea"
                    placeholder="Please provide detailed information..."
                    required
                    minlength="10"
                    maxlength="5000"
                    use:autoResize
                  ></textarea>
                  {#if errors.description}
                    <div class="if-field-error">{errors.description}</div>
                  {/if}
                </div>

                <!-- Email -->
                {#if actualRequireEmail}
                  <div class="if-field-group">
                    <label for="email" class="if-label">Email *</label>
                    <input
                      id="email"
                      bind:value={formData.email}
                      type="email"
                      class="if-input"
                      placeholder="your@email.com"
                      required={actualRequireEmail}
                    />
                    {#if errors.email}
                      <div class="if-field-error">{errors.email}</div>
                    {/if}
                  </div>
                {/if}

                <!-- File Attachments -->
                {#if actualAllowFileUploads}
                  <div class="if-field-group">
                    <label class="if-label">Attachments</label>
                    <div class="if-file-upload">
                      <input
                        bind:this={fileInput}
                        type="file"
                        multiple
                        on:change={handleFileSelect}
                        class="if-file-input"
                        accept={allowedFileTypes.join(',')}
                      />
                      <button
                        type="button"
                        class="if-file-button"
                        on:click={() => fileInput?.click()}
                      >
                        Choose Files
                      </button>
                      {#if selectedFiles.length > 0}
                        <div class="if-file-list">
                          {#each selectedFiles as file (file.name)}
                            <div class="if-file-item">
                              <span class="if-file-name">{file.name}</span>
                              <button
                                type="button"
                                class="if-file-remove"
                                on:click={() => removeFile(file)}
                              >
                                ×
                              </button>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- Custom Fields -->
                {#each customFields as field (field.name)}
                  <div class="if-field-group">
                    <label for={field.name} class="if-label">
                      {field.label}
                      {#if field.required}<span>*</span>{/if}
                    </label>
                    
                    {#if field.type === 'text' || field.type === 'email'}
                      <input
                        id={field.name}
                        value={formData.custom[field.name] || ''}
                        on:input={(e) => handleCustomFieldChange(field.name, e.currentTarget.value)}
                        type={field.type}
                        class="if-input"
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    {:else if field.type === 'textarea'}
                      <textarea
                        id={field.name}
                        value={formData.custom[field.name] || ''}
                        on:input={(e) => handleCustomFieldChange(field.name, e.currentTarget.value)}
                        class="if-textarea"
                        placeholder={field.placeholder}
                        required={field.required}
                        rows="3"
                        use:autoResize
                      ></textarea>
                    {:else if field.type === 'select'}
                      <select
                        id={field.name}
                        value={formData.custom[field.name] || ''}
                        on:change={(e) => handleCustomFieldChange(field.name, e.currentTarget.value)}
                        class="if-select"
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {#each field.options || [] as option (option.value)}
                          <option value={option.value}>{option.label}</option>
                        {/each}
                      </select>
                    {:else if field.type === 'checkbox'}
                      <div class="if-checkbox-group">
                        <input
                          id={field.name}
                          checked={formData.custom[field.name] || false}
                          on:change={(e) => handleCustomFieldChange(field.name, e.currentTarget.checked)}
                          type="checkbox"
                          class="if-checkbox"
                        />
                        <label for={field.name} class="if-checkbox-label">
                          {field.placeholder || field.label}
                        </label>
                      </div>
                    {/if}
                  </div>
                {/each}

                <!-- Actions -->
                <div class="if-form-actions">
                  <button
                    type="button"
                    class="if-btn if-btn-secondary"
                    on:click={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="if-btn if-btn-primary"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            {/if}
          </div>

          <!-- Modal Footer -->
          <footer class="if-modal-footer">
            <p class="if-powered-by">
              Powered by <a href="https://issueflow.dev" target="_blank" rel="noopener noreferrer">IssueFlow</a>
            </p>
          </footer>
        </div>
      </div>
    {/if}
  </div>
{/if}
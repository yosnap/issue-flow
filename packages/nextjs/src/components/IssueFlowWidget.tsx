/**
 * @fileoverview IssueFlow Widget Component for Next.js
 * 
 * Main widget component that provides a complete feedback collection interface
 * optimized for Next.js with SSR/SSG support and React best practices.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIssueFlow } from '../hooks/useIssueFlow';
import type {
  IssueFlowWidgetProps,
  Issue,
  IssueType,
  IssuePriority,
  FormField,
} from '../types';

/**
 * IssueFlow Widget Component
 */
export function IssueFlowWidget({
  config,
  position = 'bottom-right',
  triggerText = 'Feedback',
  className = '',
  disabled = false,
  hidden = false,
  theme,
  showTrigger = true,
  autoOpen = false,
  autoClose = true,
  autoCloseDelay = 3000,
  customFields = [],
  showPriority = true,
  requireEmail = false,
  allowFileUploads = false,
  onIssueSubmitted,
  onWidgetOpened,
  onWidgetClosed,
  onError,
}: IssueFlowWidgetProps) {
  const {
    config: globalConfig,
    isLoading: globalLoading,
    error: globalError,
    initialize,
    submitIssue,
    openWidget: globalOpenWidget,
    closeWidget: globalCloseWidget,
  } = useIssueFlow({ config });

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    type: 'feedback' as IssueType,
    priority: 'medium' as IssuePriority,
    title: '',
    description: '',
    email: '',
    custom: {} as Record<string, any>,
  });

  // Validation errors
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    email: '',
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalTitleId = useMemo(() => `if-modal-title-${Math.random().toString(36).substr(2, 9)}`, []);

  // Configuration
  const currentConfig = config || globalConfig;
  const actualRequireEmail = requireEmail || currentConfig?.behavior?.requireEmail || false;
  const actualAllowFileUploads = allowFileUploads || currentConfig?.behavior?.allowFileUploads || false;
  const allowedFileTypes = currentConfig?.behavior?.allowedFileTypes || [];
  const maxAttachmentSize = currentConfig?.behavior?.maxAttachmentSize || 5 * 1024 * 1024;

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.title.length >= 3 &&
           formData.description.length >= 10 &&
           (!actualRequireEmail || isValidEmail(formData.email));
  }, [formData.title, formData.description, formData.email, actualRequireEmail]);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Methods
  const openModal = useCallback((): void => {
    if (disabled) return;
    
    setIsModalOpen(true);
    resetFormState();
    globalOpenWidget();
    onWidgetOpened?.();
    
    // Focus first input after modal opens
    setTimeout(() => {
      const firstInput = document.querySelector('.if-feedback-form .if-input') as HTMLInputElement;
      firstInput?.focus();
    }, 100);
  }, [disabled, globalOpenWidget, onWidgetOpened]);

  const closeModal = useCallback((): void => {
    setIsModalOpen(false);
    globalCloseWidget();
    onWidgetClosed?.();
  }, [globalCloseWidget, onWidgetClosed]);

  const handleOverlayClick = useCallback((event: React.MouseEvent): void => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const handleSubmit = useCallback(async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    
    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    clearSubmissionError();

    try {
      const issueData: Partial<Issue> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        metadata: {
          source: 'nextjs-widget',
          email: formData.email || undefined,
          customFields: formData.custom,
          attachments: selectedFiles.map(f => f.name),
        },
      };

      const result = await submitIssue(issueData);
      
      setIsSuccess(true);
      onIssueSubmitted?.(result);

      // Auto-close after delay if configured
      if (autoClose) {
        setTimeout(() => {
          closeModal();
        }, autoCloseDelay);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to submit feedback');
      setSubmissionError(err);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    isSubmitting,
    formData,
    selectedFiles,
    submitIssue,
    onIssueSubmitted,
    onError,
    autoClose,
    autoCloseDelay,
    closeModal,
  ]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      // Validate file size
      for (const file of newFiles) {
        if (file.size > maxAttachmentSize) {
          alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxAttachmentSize)}`);
          return;
        }
      }
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, [maxAttachmentSize]);

  const removeFile = useCallback((file: File): void => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  }, []);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const resetForm = useCallback((): void => {
    setFormData({
      type: 'feedback',
      priority: 'medium',
      title: '',
      description: '',
      email: '',
      custom: {},
    });
    setSelectedFiles([]);
    setIsSuccess(false);
    clearValidationErrors();
  }, []);

  const resetFormState = useCallback((): void => {
    setIsSubmitting(false);
    setIsSuccess(false);
    clearSubmissionError();
    
    if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen, resetForm]);

  const clearSubmissionError = useCallback((): void => {
    setSubmissionError(null);
  }, []);

  const clearValidationErrors = useCallback((): void => {
    setErrors({
      title: '',
      description: '',
      email: '',
    });
  }, []);

  const handleFormChange = useCallback((field: string, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCustomFieldChange = useCallback((fieldName: string, value: any): void => {
    setFormData(prev => ({
      ...prev,
      custom: {
        ...prev.custom,
        [fieldName]: value,
      },
    }));
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isModalOpen, closeModal]);

  // Initialize if config provided
  useEffect(() => {
    if (config) {
      initialize(config);
    }
  }, [config, initialize]);

  // Auto-open if configured
  useEffect(() => {
    if (autoOpen && isMounted) {
      openModal();
    }
  }, [autoOpen, isMounted, openModal]);

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server or if hidden
  if (!isMounted || hidden) {
    return null;
  }

  const widgetClasses = `if-widget if-position-${position} ${className} ${disabled ? 'if-disabled' : ''} ${hidden ? 'if-hidden' : ''}`.trim();
  const triggerClasses = `if-widget-trigger if-position-${position} ${disabled ? 'if-disabled' : ''}`.trim();

  const triggerButton = showTrigger && !isModalOpen && (
    <button
      className={triggerClasses}
      disabled={disabled}
      onClick={openModal}
      type="button"
      aria-label={triggerText}
    >
      <span className="if-trigger-icon">💬</span>
      <span className="if-trigger-text">{triggerText}</span>
    </button>
  );

  const modal = isModalOpen && createPortal(
    <div
      className="if-widget-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
    >
      <div className="if-widget-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <header className="if-modal-header">
          <h2 id={modalTitleId} className="if-modal-title">Send Feedback</h2>
          <button
            className="if-modal-close"
            onClick={closeModal}
            aria-label="Close feedback form"
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        {/* Modal Body */}
        <div className="if-modal-body">
          {/* Loading State */}
          {(isSubmitting || globalLoading) && (
            <div className="if-loading">
              <div className="if-spinner"></div>
              <p>Sending your feedback...</p>
            </div>
          )}

          {/* Error State */}
          {(submissionError || globalError) && !isSubmitting && (
            <div className="if-error">
              <div className="if-error-icon">⚠️</div>
              <div className="if-error-content">
                <h3>Something went wrong</h3>
                <p>{(submissionError || globalError)?.message}</p>
                <button className="if-retry-btn" onClick={clearSubmissionError} type="button">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="if-success">
              <div className="if-success-icon">✅</div>
              <div className="if-success-content">
                <h3>Thank you!</h3>
                <p>Your feedback has been sent successfully!</p>
                <button className="if-success-btn" onClick={resetForm} type="button">
                  Send Another
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {!isSubmitting && !globalLoading && !submissionError && !globalError && !isSuccess && (
            <form onSubmit={handleSubmit} className="if-feedback-form">
              {/* Issue Type */}
              <div className="if-field-group">
                <label htmlFor="issueType" className="if-label">Type</label>
                <select
                  id="issueType"
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  className="if-select"
                  required
                >
                  <option value="feedback">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="question">Question</option>
                </select>
              </div>

              {/* Priority */}
              {showPriority && (
                <div className="if-field-group">
                  <label htmlFor="priority" className="if-label">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                    className="if-select"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}

              {/* Title */}
              <div className="if-field-group">
                <label htmlFor="title" className="if-label">Title *</label>
                <input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  type="text"
                  className="if-input"
                  placeholder="Brief description of your feedback"
                  required
                  minLength={3}
                  maxLength={200}
                />
                {errors.title && (
                  <div className="if-field-error">{errors.title}</div>
                )}
              </div>

              {/* Description */}
              <div className="if-field-group">
                <label htmlFor="description" className="if-label">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="if-textarea"
                  placeholder="Please provide detailed information..."
                  rows={4}
                  required
                  minLength={10}
                  maxLength={5000}
                />
                {errors.description && (
                  <div className="if-field-error">{errors.description}</div>
                )}
              </div>

              {/* Email */}
              {actualRequireEmail && (
                <div className="if-field-group">
                  <label htmlFor="email" className="if-label">Email *</label>
                  <input
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    type="email"
                    className="if-input"
                    placeholder="your@email.com"
                    required={actualRequireEmail}
                  />
                  {errors.email && (
                    <div className="if-field-error">{errors.email}</div>
                  )}
                </div>
              )}

              {/* File Attachments */}
              {actualAllowFileUploads && (
                <div className="if-field-group">
                  <label className="if-label">Attachments</label>
                  <div className="if-file-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="if-file-input"
                      accept={allowedFileTypes.join(',')}
                    />
                    <button
                      type="button"
                      className="if-file-button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </button>
                    {selectedFiles.length > 0 && (
                      <div className="if-file-list">
                        {selectedFiles.map((file) => (
                          <div key={file.name} className="if-file-item">
                            <span className="if-file-name">{file.name}</span>
                            <button
                              type="button"
                              className="if-file-remove"
                              onClick={() => removeFile(file)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              {customFields.map((field) => (
                <div key={field.name} className="if-field-group">
                  <label htmlFor={field.name} className="if-label">
                    {field.label}
                    {field.required && <span>*</span>}
                  </label>
                  
                  {(field.type === 'text' || field.type === 'email') && (
                    <input
                      id={field.name}
                      value={formData.custom[field.name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                      type={field.type}
                      className="if-input"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      id={field.name}
                      value={formData.custom[field.name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                      className="if-textarea"
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <select
                      id={field.name}
                      value={formData.custom[field.name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                      className="if-select"
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'checkbox' && (
                    <div className="if-checkbox-group">
                      <input
                        id={field.name}
                        checked={formData.custom[field.name] || false}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                        type="checkbox"
                        className="if-checkbox"
                      />
                      <label htmlFor={field.name} className="if-checkbox-label">
                        {field.placeholder || field.label}
                      </label>
                    </div>
                  )}
                </div>
              ))}

              {/* Actions */}
              <div className="if-form-actions">
                <button
                  type="button"
                  className="if-btn if-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="if-btn if-btn-primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="if-modal-footer">
          <p className="if-powered-by">
            Powered by <a href="https://issueflow.dev" target="_blank" rel="noopener noreferrer">IssueFlow</a>
          </p>
        </footer>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={widgetClasses}>
      {triggerButton}
      {modal}
    </div>
  );
}
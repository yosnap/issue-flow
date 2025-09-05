/**
 * @fileoverview IssueForm Component
 * 
 * Main issue submission form with validation, file upload, and premium features.
 * Integrates business model tiers and community contribution patterns.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { IssueFormProps, IssueData, FormField } from '../types';
import { useIssueFlowContext } from '../hooks/useIssueFlowContext';

export function IssueForm({
  config = {},
  onSubmit,
  onCancel,
  loading = false,
  error,
  fields,
  className,
}: IssueFormProps) {
  const context = useIssueFlowContext();
  const mergedConfig = { ...context.config, ...config };
  
  // Form state
  const [formData, setFormData] = useState<Partial<IssueData>>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'bug',
    metadata: {},
    attachments: [],
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  // Business model: Check premium features
  const isPremiumTier = useMemo(() => {
    // This would be determined by the organization's plan
    // For now, we'll check if it's configured
    return mergedConfig.behavior?.enableAttachments || false;
  }, [mergedConfig.behavior?.enableAttachments]);
  
  // Form fields configuration (extensible via plugin system)
  const defaultFields: FormField[] = [
    {
      name: 'title',
      label: 'Issue Title',
      type: 'text',
      required: true,
      placeholder: 'Describe the issue briefly...',
      validation: (value: string) => {
        if (!value || value.trim().length < 5) {
          return 'Title must be at least 5 characters long';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
        return undefined;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      placeholder: 'Please provide detailed information about the issue...\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:',
      validation: (value: string) => {
        if (!value || value.trim().length < 10) {
          return 'Description must be at least 10 characters long';
        }
        return undefined;
      }
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: false,
      options: [
        { value: 'low', label: '🟢 Low' },
        { value: 'medium', label: '🟡 Medium' },
        { value: 'high', label: '🟠 High' },
        { value: 'critical', label: '🔴 Critical' },
      ]
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select', 
      required: false,
      options: [
        { value: 'bug', label: '🐛 Bug Report' },
        { value: 'feature', label: '✨ Feature Request' },
        { value: 'improvement', label: '📈 Improvement' },
        { value: 'question', label: '❓ Question' },
        { value: 'other', label: '📝 Other' },
      ]
    },
  ];
  
  // Add email field if required and user not identified
  if (mergedConfig.behavior?.requireEmail && !mergedConfig.user?.email) {
    defaultFields.splice(2, 0, {
      name: 'email',
      label: 'Your Email',
      type: 'email',
      required: true,
      placeholder: 'your.email@example.com',
      validation: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return undefined;
      }
    });
  }
  
  // Use custom fields if provided, otherwise use defaults
  const formFields = fields || defaultFields;
  
  // Handle form changes
  const handleInputChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validationErrors]);
  
  // File upload handling (Premium feature)
  const handleFileUpload = useCallback((files: FileList) => {
    if (!isPremiumTier) {
      // Show upgrade prompt
      console.warn('File attachments require premium plan');
      return;
    }
    
    const maxSize = mergedConfig.behavior?.maxAttachmentSize || 5 * 1024 * 1024; // 5MB
    const allowedFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
        return;
      }
      allowedFiles.push(file);
    });
    
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...allowedFiles]
    }));
  }, [isPremiumTier, mergedConfig.behavior?.maxAttachmentSize]);
  
  // Drag and drop handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);
  
  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
  }, []);
  
  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    formFields.forEach(field => {
      if (field.required && !formData[field.name as keyof IssueData]) {
        errors[field.name] = `${field.label} is required`;
      } else if (field.validation && formData[field.name as keyof IssueData]) {
        const error = field.validation(formData[field.name as keyof IssueData]);
        if (error) {
          errors[field.name] = error;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formFields, formData]);
  
  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Community contribution: Add helpful metadata for developers
      const enrichedData: IssueData = {
        ...formData,
        metadata: {
          ...formData.metadata,
          // Browser info for debugging
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          // User identification if available
          ...(mergedConfig.user && {
            user: {
              id: mergedConfig.user.id,
              email: mergedConfig.user.email || formData.email,
              name: mergedConfig.user.name,
            }
          })
        }
      } as IssueData;
      
      await onSubmit(enrichedData);
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'bug',
        metadata: {},
        attachments: [],
      });
      
    } catch (err) {
      // Error is handled by parent component
      console.error('Form submission error:', err);
    }
  }, [formData, validateForm, onSubmit, mergedConfig.user]);
  
  // Auto-save draft (Premium feature)
  useEffect(() => {
    if (!isPremiumTier) return;
    
    const saveTimeout = setTimeout(() => {
      if (formData.title || formData.description) {
        localStorage.setItem('issueflow-draft', JSON.stringify(formData));
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [formData, isPremiumTier]);
  
  // Load draft on mount (Premium feature)
  useEffect(() => {
    if (!isPremiumTier) return;
    
    const draft = localStorage.getItem('issueflow-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsedDraft }));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [isPremiumTier]);
  
  // Styles
  const formStyles: React.CSSProperties = {
    padding: '24px',
    fontFamily: 'var(--if-font-family, inherit)',
    fontSize: 'var(--if-font-size, 14px)',
  };
  
  const fieldStyles: React.CSSProperties = {
    marginBottom: '16px',
  };
  
  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    color: 'var(--if-text, #374151)',
  };
  
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--if-border, #d1d5db)',
    borderRadius: 'var(--if-border-radius, 6px)',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    backgroundColor: 'var(--if-background, #ffffff)',
    color: 'var(--if-text, #374151)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };
  
  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    minHeight: '120px',
    resize: 'vertical' as const,
  };
  
  const errorStyles: React.CSSProperties = {
    color: 'var(--if-error, #ef4444)',
    fontSize: '12px',
    marginTop: '4px',
  };
  
  const buttonStyles: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 'var(--if-border-radius, 6px)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: 'inherit',
    transition: 'all 0.2s',
  };
  
  const primaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'var(--if-primary, #3b82f6)',
    color: '#ffffff',
    marginRight: '8px',
  };
  
  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: 'var(--if-text, #6b7280)',
    border: '1px solid var(--if-border, #d1d5db)',
  };
  
  // Render field
  const renderField = (field: FormField) => {
    const hasError = !!validationErrors[field.name];
    const fieldValue = formData[field.name as keyof IssueData] || '';
    
    const fieldInputStyles = {
      ...inputStyles,
      borderColor: hasError ? 'var(--if-error, #ef4444)' : 'var(--if-border, #d1d5db)',
    };
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...textareaStyles, borderColor: fieldInputStyles.borderColor }}
            required={field.required}
          />
        );
        
      case 'select':
        return (
          <select
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            style={fieldInputStyles}
            required={field.required}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      default:
        return (
          <input
            type={field.type}
            value={fieldValue as string}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={fieldInputStyles}
            required={field.required}
          />
        );
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className} style={formStyles}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--if-text, #111827)'
        }}>
          Report an Issue
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--if-text, #6b7280)'
        }}>
          Help us improve by sharing your feedback
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--if-border-radius, 6px)',
          color: 'var(--if-error, #dc2626)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}
      
      {/* Form fields */}
      {formFields.map(field => (
        <div key={field.name} style={fieldStyles}>
          <label style={labelStyles}>
            {field.label}
            {field.required && <span style={{ color: 'var(--if-error, #ef4444)' }}>*</span>}
          </label>
          {renderField(field)}
          {validationErrors[field.name] && (
            <div style={errorStyles}>{validationErrors[field.name]}</div>
          )}
        </div>
      ))}
      
      {/* File upload (Premium feature) */}
      {mergedConfig.behavior?.enableAttachments && (
        <div style={fieldStyles}>
          <label style={labelStyles}>Attachments</label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? 'var(--if-primary, #3b82f6)' : 'var(--if-border, #d1d5db)'}`,
              borderRadius: 'var(--if-border-radius, 6px)',
              padding: '16px',
              textAlign: 'center' as const,
              cursor: 'pointer',
              backgroundColor: isDragging ? '#f0f9ff' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              <div>📎 Drop files here or click to upload</div>
              <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)', marginTop: '4px' }}>
                Max {(mergedConfig.behavior?.maxAttachmentSize || 5242880) / 1024 / 1024}MB per file
              </div>
            </label>
          </div>
          
          {/* Attachment list */}
          {formData.attachments && formData.attachments.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {formData.attachments.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '12px',
                }}>
                  <span>{file.name} ({Math.round(file.size / 1024)}KB)</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--if-error, #ef4444)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--if-border, #e5e7eb)',
      }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={secondaryButtonStyles}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          style={{
            ...primaryButtonStyles,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? '🔄 Submitting...' : '📤 Submit Issue'}
        </button>
      </div>
      
      {/* Premium upgrade prompt */}
      {!isPremiumTier && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--if-border-radius, 6px)',
          fontSize: '12px',
          textAlign: 'center' as const,
        }}>
          <span>💎 Want file attachments, draft saving, and priority support? </span>
          <a href="#upgrade" style={{ color: 'var(--if-primary, #3b82f6)', textDecoration: 'none' }}>
            Upgrade to Pro
          </a>
        </div>
      )}
    </form>
  );
}
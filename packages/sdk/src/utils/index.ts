/**
 * @fileoverview IssueFlow Utility Functions
 * 
 * Common utility functions for the IssueFlow SDK.
 */

import { WidgetConfig, CreateIssueRequest } from '../types';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current viewport dimensions
 */
export function getViewport(): { width: number; height: number } {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return { width: 0, height: 0 };
}

/**
 * Get current page URL
 */
export function getCurrentUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return '';
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return '';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  return html.replace(/[<>&"']/g, (char) => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[char];
  });
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/*', 'text/*', 'application/pdf'],
  maxSize: number = 10 * 1024 * 1024 // 10MB
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`,
    };
  }

  const isValidType = allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const baseType = type.replace('/*', '');
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });

  if (!isValidType) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Create default widget configuration
 */
export function createDefaultConfig(overrides: Partial<WidgetConfig> = {}): WidgetConfig {
  return deepMerge(
    {
      apiUrl: '',
      projectId: '',
      position: 'bottom-right' as const,
      triggerText: 'Feedback',
      theme: 'auto' as const,
      primaryColor: '#2563eb',
      enableScreenshot: true,
      captureConsoleErrors: true,
      customFields: [],
      requiredFields: ['title', 'description', 'reporter.email', 'reporter.name'],
      welcomeMessage: 'We\'d love to hear your feedback!',
      successMessage: 'Thank you for your feedback! We\'ll get back to you soon.',
      showPoweredBy: true,
      timeout: 30000,
      debug: false,
    },
    overrides
  );
}

/**
 * Auto-populate metadata for issue creation
 */
export function enrichIssueMetadata(issue: CreateIssueRequest): CreateIssueRequest {
  const metadata = {
    userAgent: getUserAgent(),
    url: getCurrentUrl(),
    viewport: getViewport(),
    timestamp: new Date(),
    sessionId: generateSessionId(),
    ...issue.metadata,
  };

  return {
    ...issue,
    metadata,
  };
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.statusText) return error.response.statusText;
  return 'An unknown error occurred';
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error('Retry failed'); // This should never be reached
}
/**
 * @fileoverview React Adapter Utilities
 * 
 * Utility functions for React components and hooks.
 * Includes theme helpers, validation, and plugin integration utilities.
 */

import type { IssueFlowConfig, ThemeConfig, StyleObject } from '../types';

/**
 * Generate CSS custom properties from theme configuration
 */
export function generateThemeVariables(theme: ThemeConfig = {}): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Colors
  if (theme.primaryColor) variables['--if-primary'] = theme.primaryColor;
  if (theme.backgroundColor) variables['--if-background'] = theme.backgroundColor;
  if (theme.textColor) variables['--if-text'] = theme.textColor;
  if (theme.borderColor) variables['--if-border'] = theme.borderColor;
  
  // Typography
  if (theme.fontFamily) variables['--if-font-family'] = theme.fontFamily;
  if (theme.fontSize) variables['--if-font-size'] = `${theme.fontSize}px`;
  
  // Layout
  if (theme.borderRadius) variables['--if-border-radius'] = `${theme.borderRadius}px`;
  
  // Computed colors
  variables['--if-error'] = '#ef4444';
  variables['--if-success'] = '#10b981';
  variables['--if-warning'] = '#f59e0b';
  variables['--if-info'] = '#3b82f6';
  
  // Spacing
  variables['--if-spacing-sm'] = '8px';
  variables['--if-spacing-md'] = '16px';
  variables['--if-spacing-lg'] = '24px';
  
  // Shadows
  variables['--if-shadow'] = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  variables['--if-shadow-lg'] = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  
  return variables;
}

/**
 * Apply theme variables to document root
 */
export function applyThemeVariables(theme: ThemeConfig = {}): void {
  const variables = generateThemeVariables(theme);
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Remove theme variables from document root
 */
export function removeThemeVariables(): void {
  const root = document.documentElement;
  const variables = generateThemeVariables();
  
  Object.keys(variables).forEach(property => {
    root.style.removeProperty(property);
  });
}

/**
 * Validate configuration object
 */
export function validateConfig(config: Partial<IssueFlowConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Required fields
  if (!config.projectId) {
    errors.push('projectId is required');
  }
  
  // Validate projectId format
  if (config.projectId && !/^[a-zA-Z0-9-_]+$/.test(config.projectId)) {
    errors.push('projectId must contain only alphanumeric characters, hyphens, and underscores');
  }
  
  // Validate API URL
  if (config.apiUrl) {
    try {
      new URL(config.apiUrl);
    } catch {
      errors.push('apiUrl must be a valid URL');
    }
  }
  
  // Validate organization slug
  if (config.organizationSlug && !/^[a-z0-9-]+$/.test(config.organizationSlug)) {
    errors.push('organizationSlug must contain only lowercase letters, numbers, and hyphens');
  }
  
  // Validate widget position
  if (config.widget?.position) {
    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (!validPositions.includes(config.widget.position)) {
      errors.push(`widget.position must be one of: ${validPositions.join(', ')}`);
    }
  }
  
  // Validate theme mode
  if (config.theme?.mode) {
    const validModes = ['light', 'dark', 'auto'];
    if (!validModes.includes(config.theme.mode)) {
      errors.push(`theme.mode must be one of: ${validModes.join(', ')}`);
    }
  }
  
  // Validate numeric values
  if (config.theme?.fontSize && (config.theme.fontSize < 8 || config.theme.fontSize > 32)) {
    errors.push('theme.fontSize must be between 8 and 32');
  }
  
  if (config.theme?.borderRadius && (config.theme.borderRadius < 0 || config.theme.borderRadius > 50)) {
    errors.push('theme.borderRadius must be between 0 and 50');
  }
  
  if (config.behavior?.maxAttachmentSize && config.behavior.maxAttachmentSize < 1024) {
    errors.push('behavior.maxAttachmentSize must be at least 1024 bytes (1KB)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Merge configuration objects with deep merge for nested objects
 */
export function mergeConfig(
  base: IssueFlowConfig,
  override: Partial<IssueFlowConfig>
): IssueFlowConfig {
  return {
    ...base,
    ...override,
    widget: {
      ...base.widget,
      ...override.widget,
    },
    theme: {
      ...base.theme,
      ...override.theme,
    },
    behavior: {
      ...base.behavior,
      ...override.behavior,
    },
    user: {
      ...base.user,
      ...override.user,
      metadata: {
        ...base.user?.metadata,
        ...override.user?.metadata,
      }
    },
  };
}

/**
 * Generate unique ID for components
 */
export function generateId(prefix: string = 'if'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Slugify string for URL-safe identifiers
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect user's preferred color scheme
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a throttled function
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
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert CSS-in-JS style object to CSS string
 */
export function styleObjectToCss(styles: StyleObject): string {
  return Object.entries(styles)
    .map(([property, value]) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(' ');
}

/**
 * Get browser information for debugging
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  platform: string;
} {
  const userAgent = navigator.userAgent;
  
  let name = 'Unknown';
  let version = 'Unknown';
  
  // Detect browser
  if (userAgent.indexOf('Chrome') > -1) {
    name = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.1 || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    name = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.1 || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    name = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.1 || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    name = 'Edge';
    version = userAgent.match(/Edge\/(\d+)/)?.1 || 'Unknown';
  }
  
  return {
    name,
    version,
    platform: navigator.platform,
  };
}

/**
 * Plugin integration helpers
 */
export const pluginHelpers = {
  /**
   * Register a custom component for plugin system
   */
  registerComponent: (name: string, component: React.ComponentType) => {
    // This would integrate with the plugin system
    console.log(`Registering component: ${name}`, component);
  },
  
  /**
   * Register a custom hook for plugin system
   */
  registerHook: (name: string, hook: (...args: any[]) => any) => {
    // This would integrate with the plugin system
    console.log(`Registering hook: ${name}`, hook);
  },
  
  /**
   * Emit event to plugin system
   */
  emitEvent: (eventName: string, data: any) => {
    // This would emit events to the plugin system
    console.log(`Emitting event: ${eventName}`, data);
  },
};

/**
 * Business model helpers
 */
export const businessHelpers = {
  /**
   * Check if feature is available for current plan
   */
  isFeatureAvailable: (feature: string, plan: string = 'free'): boolean => {
    const featurePlans = {
      'file-attachments': ['pro', 'agency', 'enterprise'],
      'priority-support': ['pro', 'agency', 'enterprise'],
      'white-label': ['agency', 'enterprise'],
      'analytics': ['agency', 'enterprise'],
      'sso': ['enterprise'],
      'api-access': ['pro', 'agency', 'enterprise'],
      'webhooks': ['pro', 'agency', 'enterprise'],
    };
    
    const requiredPlans = featurePlans[feature as keyof typeof featurePlans] || [];
    return requiredPlans.includes(plan);
  },
  
  /**
   * Get upgrade URL for plan
   */
  getUpgradeUrl: (currentPlan: string = 'free', targetPlan?: string): string => {
    const baseUrl = 'https://issueflow.dev/upgrade';
    const params = new URLSearchParams();
    
    params.set('from', currentPlan);
    if (targetPlan) params.set('to', targetPlan);
    
    return `${baseUrl}?${params.toString()}`;
  },
  
  /**
   * Track usage for analytics and billing
   */
  trackUsage: (event: string, metadata?: Record<string, any>) => {
    // This would send usage data to analytics service
    console.log(`Tracking usage: ${event}`, metadata);
  },
};

/**
 * Community contribution helpers
 */
export const communityHelpers = {
  /**
   * Get contribution guidelines URL
   */
  getContributionUrl: () => 'https://github.com/issueflow/issueflow/blob/main/CONTRIBUTING.md',
  
  /**
   * Get Discord community URL
   */
  getCommunityUrl: () => 'https://discord.gg/issueflow',
  
  /**
   * Report a bug in IssueFlow itself
   */
  reportBug: (issue: { title: string; description: string }) => {
    const url = new URL('https://github.com/issueflow/issueflow/issues/new');
    url.searchParams.set('template', 'bug_report.md');
    url.searchParams.set('title', issue.title);
    url.searchParams.set('body', issue.description);
    
    window.open(url.toString(), '_blank');
  },
  
  /**
   * Request a feature for IssueFlow
   */
  requestFeature: (request: { title: string; description: string }) => {
    const url = new URL('https://github.com/issueflow/issueflow/issues/new');
    url.searchParams.set('template', 'feature_request.md');
    url.searchParams.set('title', request.title);
    url.searchParams.set('body', request.description);
    
    window.open(url.toString(), '_blank');
  },
};

// Export version for debugging
export const REACT_ADAPTER_VERSION = '0.1.0';
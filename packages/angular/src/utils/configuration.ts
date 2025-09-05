/**
 * @fileoverview Angular Configuration Utilities
 * 
 * Helper functions for creating and validating IssueFlow
 * configuration in Angular applications.
 */

import type { IssueFlowConfig, AngularIssueFlowConfig } from '../types';

/**
 * Default configuration for Angular applications
 */
const DEFAULT_ANGULAR_CONFIG: Partial<AngularIssueFlowConfig> = {
  module: {
    lazyLoad: false,
    preload: true,
  },
  forms: {
    reactive: true,
    validators: [],
  },
  animations: {
    enabled: true,
    duration: 300,
    custom: [],
  },
  injection: {
    providedIn: 'root',
    tokens: [],
  },
};

/**
 * Create a complete IssueFlow configuration for Angular
 */
export function createIssueFlowConfiguration(
  baseConfig: Partial<IssueFlowConfig>,
  angularConfig?: Partial<AngularIssueFlowConfig>
): IssueFlowConfig {
  const config: IssueFlowConfig = {
    // Required fields
    projectId: baseConfig.projectId || '',
    apiUrl: baseConfig.apiUrl || 'https://api.issueflow.dev',
    
    // Optional configuration with defaults
    organizationSlug: baseConfig.organizationSlug,
    apiKey: baseConfig.apiKey,
    token: baseConfig.token,
    
    // Widget configuration
    widget: {
      position: 'bottom-right',
      trigger: 'button',
      triggerText: 'Feedback',
      ...baseConfig.widget,
    },
    
    // Theme configuration
    theme: {
      mode: 'auto',
      primaryColor: '#3b82f6',
      borderRadius: 8,
      ...baseConfig.theme,
    },
    
    // Behavior configuration
    behavior: {
      captureConsoleErrors: false,
      captureUnhandledRejections: false,
      requireEmail: false,
      allowAnonymous: true,
      showSuccessMessage: true,
      autoClose: true,
      autoCloseDelay: 3000,
      allowFileUploads: false,
      maxAttachmentSize: 5 * 1024 * 1024, // 5MB
      allowedFileTypes: ['image/*', '.pdf', '.txt'],
      ...baseConfig.behavior,
    },
    
    // Integration configuration
    integrations: {
      ...baseConfig.integrations,
    },
    
    // User configuration
    user: {
      autoCapture: {
        userAgent: true,
        url: true,
        timestamp: true,
        viewport: true,
      },
      metadata: {},
      ...baseConfig.user,
    },
    
    // Development configuration
    development: {
      debug: false,
      mockMode: false,
      ...baseConfig.development,
    },
    
    // Angular-specific configuration
    angular: {
      ...DEFAULT_ANGULAR_CONFIG,
      ...angularConfig,
    },
  };
  
  // Validate the configuration
  validateConfiguration(config);
  
  return config;
}

/**
 * Create configuration for development/testing
 */
export function createDevelopmentConfiguration(
  projectId: string,
  overrides?: Partial<IssueFlowConfig>
): IssueFlowConfig {
  return createIssueFlowConfiguration({
    projectId,
    apiUrl: 'https://api.dev.issueflow.dev',
    development: {
      debug: true,
      mockMode: false,
    },
    behavior: {
      captureConsoleErrors: true,
      captureUnhandledRejections: true,
      allowAnonymous: true,
    },
    ...overrides,
  });
}

/**
 * Create configuration for production
 */
export function createProductionConfiguration(
  projectId: string,
  apiKey: string,
  overrides?: Partial<IssueFlowConfig>
): IssueFlowConfig {
  return createIssueFlowConfiguration({
    projectId,
    apiKey,
    apiUrl: 'https://api.issueflow.dev',
    development: {
      debug: false,
      mockMode: false,
    },
    behavior: {
      captureConsoleErrors: false,
      captureUnhandledRejections: false,
    },
    ...overrides,
  });
}

/**
 * Create mock configuration for testing
 */
export function createMockConfiguration(
  projectId: string = 'test-project',
  overrides?: Partial<IssueFlowConfig>
): IssueFlowConfig {
  return createIssueFlowConfiguration({
    projectId,
    apiUrl: 'https://api.test.issueflow.dev',
    development: {
      debug: true,
      mockMode: true,
    },
    ...overrides,
  });
}

/**
 * Validate IssueFlow configuration
 */
export function validateConfiguration(config: IssueFlowConfig): void {
  const errors: string[] = [];
  
  // Required fields
  if (!config.projectId || config.projectId.trim().length === 0) {
    errors.push('projectId is required and cannot be empty');
  }
  
  if (!config.apiUrl || config.apiUrl.trim().length === 0) {
    errors.push('apiUrl is required and cannot be empty');
  }
  
  // Validate URL format
  if (config.apiUrl) {
    try {
      new URL(config.apiUrl);
    } catch {
      errors.push('apiUrl must be a valid URL');
    }
  }
  
  // Validate project ID format
  if (config.projectId && !/^[a-zA-Z0-9-_]+$/.test(config.projectId)) {
    errors.push('projectId must contain only alphanumeric characters, hyphens, and underscores');
  }
  
  // Validate organization slug format
  if (config.organizationSlug && !/^[a-z0-9-]+$/.test(config.organizationSlug)) {
    errors.push('organizationSlug must contain only lowercase letters, numbers, and hyphens');
  }
  
  // Validate widget configuration
  if (config.widget) {
    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (config.widget.position && !validPositions.includes(config.widget.position)) {
      errors.push(`widget.position must be one of: ${validPositions.join(', ')}`);
    }
    
    const validTriggers = ['button', 'tab', 'custom'];
    if (config.widget.trigger && !validTriggers.includes(config.widget.trigger)) {
      errors.push(`widget.trigger must be one of: ${validTriggers.join(', ')}`);
    }
  }
  
  // Validate theme configuration
  if (config.theme) {
    const validModes = ['light', 'dark', 'auto'];
    if (config.theme.mode && !validModes.includes(config.theme.mode)) {
      errors.push(`theme.mode must be one of: ${validModes.join(', ')}`);
    }
    
    if (config.theme.borderRadius && (config.theme.borderRadius < 0 || config.theme.borderRadius > 50)) {
      errors.push('theme.borderRadius must be between 0 and 50');
    }
  }
  
  // Validate behavior configuration
  if (config.behavior) {
    if (config.behavior.autoCloseDelay && config.behavior.autoCloseDelay < 1000) {
      errors.push('behavior.autoCloseDelay must be at least 1000ms');
    }
    
    if (config.behavior.maxAttachmentSize && config.behavior.maxAttachmentSize < 1024) {
      errors.push('behavior.maxAttachmentSize must be at least 1024 bytes');
    }
  }
  
  // Angular-specific validations
  if (config.angular) {
    if (config.angular.animations?.duration && config.angular.animations.duration < 0) {
      errors.push('angular.animations.duration must be non-negative');
    }
  }
  
  // Throw validation error if any issues found
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

/**
 * Merge configuration objects with deep merging
 */
export function mergeConfigurations(
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
    integrations: {
      ...base.integrations,
      ...override.integrations,
    },
    user: {
      ...base.user,
      ...override.user,
      autoCapture: {
        ...base.user?.autoCapture,
        ...override.user?.autoCapture,
      },
      metadata: {
        ...base.user?.metadata,
        ...override.user?.metadata,
      },
    },
    development: {
      ...base.development,
      ...override.development,
    },
    angular: {
      ...base.angular,
      ...override.angular,
      module: {
        ...base.angular?.module,
        ...override.angular?.module,
      },
      forms: {
        ...base.angular?.forms,
        ...override.angular?.forms,
      },
      animations: {
        ...base.angular?.animations,
        ...override.angular?.animations,
      },
      injection: {
        ...base.angular?.injection,
        ...override.angular?.injection,
      },
    },
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfiguration(
  baseConfig: Partial<IssueFlowConfig>,
  environment: 'development' | 'staging' | 'production' = 'development'
): IssueFlowConfig {
  const environmentConfigs = {
    development: {
      apiUrl: 'https://api.dev.issueflow.dev',
      development: { debug: true, mockMode: false },
      behavior: { captureConsoleErrors: true, captureUnhandledRejections: true },
    },
    staging: {
      apiUrl: 'https://api.staging.issueflow.dev',
      development: { debug: false, mockMode: false },
      behavior: { captureConsoleErrors: true, captureUnhandledRejections: true },
    },
    production: {
      apiUrl: 'https://api.issueflow.dev',
      development: { debug: false, mockMode: false },
      behavior: { captureConsoleErrors: false, captureUnhandledRejections: false },
    },
  };
  
  return createIssueFlowConfiguration({
    ...baseConfig,
    ...environmentConfigs[environment],
  });
}
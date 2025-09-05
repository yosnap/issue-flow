/**
 * @fileoverview useIssueFlow Hook
 * 
 * Main React hook for IssueFlow integration.
 * Provides issue submission, widget state management, and configuration.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { 
  IssueFlowConfig, 
  IssueData, 
  Issue, 
  UseIssueFlowReturn 
} from '../types';
import { useIssueFlowContext } from './useIssueFlowContext';

export interface UseIssueFlowOptions {
  // Override context config
  config?: Partial<IssueFlowConfig>;
  
  // Auto-open widget
  autoOpen?: boolean;
  
  // Debug mode
  debug?: boolean;
}

export function useIssueFlow(options: UseIssueFlowOptions = {}): UseIssueFlowReturn {
  const context = useIssueFlowContext();
  const { config: optionsConfig = {}, autoOpen = false, debug = false } = options;
  
  // Merge configurations (context < options)
  const config = useMemo(() => {
    return {
      ...context.config,
      ...optionsConfig,
      widget: {
        ...context.config.widget,
        ...optionsConfig.widget,
      },
      theme: {
        ...context.config.theme,
        ...optionsConfig.theme,
      },
      behavior: {
        ...context.config.behavior,
        ...optionsConfig.behavior,
      }
    };
  }, [context.config, optionsConfig]);
  
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[IssueFlow]', ...args);
    }
  }, [debug]);
  
  // Widget actions
  const open = useCallback(() => {
    log('Opening widget');
    setIsOpen(true);
    setError(null);
  }, [log]);
  
  const close = useCallback(() => {
    log('Closing widget');
    setIsOpen(false);
  }, [log]);
  
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Issue submission
  const submitIssue = useCallback(async (issueData: IssueData): Promise<Issue> => {
    if (!context.client) {
      throw new Error('IssueFlow client not initialized');
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      log('Submitting issue:', issueData);
      
      // Add user identification if available
      const enrichedData = {
        ...issueData,
        metadata: {
          ...issueData.metadata,
          // Add browser/environment info
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          // Add user info if available
          ...(config.user && {
            user: {
              id: config.user.id,
              email: config.user.email,
              name: config.user.name,
              ...config.user.metadata,
            }
          }),
        }
      };
      
      // Auto-capture screenshot if enabled
      if (config.behavior?.captureScreenshot) {
        try {
          // This would require a screenshot library or browser API
          log('Screenshot capture enabled but not implemented yet');
        } catch (screenshotError) {
          log('Screenshot capture failed:', screenshotError);
        }
      }
      
      // Submit to API
      const issue = await context.client.createIssue(enrichedData);
      
      log('Issue submitted successfully:', issue);
      
      // Auto-close if enabled
      if (config.behavior?.autoClose) {
        const delay = config.behavior.autoCloseDelay || 2000;
        setTimeout(() => {
          close();
        }, delay);
      }
      
      return issue;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit issue';
      log('Issue submission failed:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [context.client, config, log, close]);
  
  // Update configuration
  const updateConfig = useCallback((updates: Partial<IssueFlowConfig>) => {
    log('Updating config:', updates);
    context.updateConfig(updates);
  }, [context, log]);
  
  // Auto-open effect
  useEffect(() => {
    if (autoOpen && context.isInitialized) {
      log('Auto-opening widget');
      open();
    }
  }, [autoOpen, context.isInitialized, open, log]);
  
  // Error capture effects
  useEffect(() => {
    if (!config.behavior?.captureConsoleErrors) return;
    
    const originalError = console.error;
    console.error = (...args) => {
      // Capture console errors
      log('Console error captured:', args);
      // You could automatically submit these as issues
      originalError(...args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, [config.behavior?.captureConsoleErrors, log]);
  
  useEffect(() => {
    if (!config.behavior?.captureUnhandledRejections) return;
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      log('Unhandled rejection captured:', event.reason);
      // You could automatically submit these as issues
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [config.behavior?.captureUnhandledRejections, log]);
  
  return {
    // State
    isOpen,
    isSubmitting,
    error,
    
    // Actions
    open,
    close,
    toggle,
    submitIssue,
    clearError,
    
    // Configuration
    config,
    updateConfig,
  };
}
/**
 * @fileoverview IssueFlowProvider Component
 * 
 * React context provider for IssueFlow configuration and client instance.
 * Must wrap the app or component tree that uses IssueFlow.
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { IssueFlowConfig, IssueFlowContextValue } from '../types';

// Create context
export const IssueFlowContext = createContext<IssueFlowContextValue | null>(null);

export interface IssueFlowProviderProps {
  config: IssueFlowConfig;
  children: ReactNode;
  debug?: boolean;
}

export function IssueFlowProvider({ 
  config: initialConfig, 
  children, 
  debug = false 
}: IssueFlowProviderProps) {
  const [config, setConfig] = useState<IssueFlowConfig>(initialConfig);
  const [client, setClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[IssueFlow:Provider]', ...args);
    }
  }, [debug]);
  
  // Update configuration
  const updateConfig = useCallback((updates: Partial<IssueFlowConfig>) => {
    log('Updating config:', updates);
    setConfig(prev => ({
      ...prev,
      ...updates,
      widget: {
        ...prev.widget,
        ...updates.widget,
      },
      theme: {
        ...prev.theme,
        ...updates.theme,
      },
      behavior: {
        ...prev.behavior,
        ...updates.behavior,
      }
    }));
  }, [log]);
  
  // Initialize IssueFlow client
  useEffect(() => {
    let mounted = true;
    
    async function initializeClient() {
      try {
        log('Initializing IssueFlow client with config:', config);
        
        // Validate required config
        if (!config.projectId) {
          throw new Error('projectId is required in IssueFlow config');
        }
        
        // Import and initialize client from @issueflow/core
        // This is a placeholder - the actual implementation would depend on the core SDK
        const { createIssueFlowApp } = await import('@issueflow/core');
        
        const clientConfig = {
          projectId: config.projectId,
          apiKey: config.apiKey,
          apiUrl: config.apiUrl || 'https://api.issueflow.dev',
          organizationSlug: config.organizationSlug,
        };
        
        // Create client instance
        const appInstance = await createIssueFlowApp(clientConfig);
        
        if (!mounted) return;
        
        log('IssueFlow client initialized successfully');
        setClient(appInstance);
        setIsInitialized(true);
        setInitError(null);
        
      } catch (error) {
        if (!mounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize IssueFlow';
        log('Client initialization failed:', error);
        setInitError(errorMessage);
        setIsInitialized(false);
      }
    }
    
    initializeClient();
    
    return () => {
      mounted = false;
    };
  }, [config.projectId, config.apiKey, config.apiUrl, config.organizationSlug, log]);
  
  // Apply CSS custom properties for theming
  useEffect(() => {
    if (!config.theme) return;
    
    const root = document.documentElement;
    
    // Apply theme variables
    if (config.theme.primaryColor) {
      root.style.setProperty('--if-primary', config.theme.primaryColor);
    }
    
    if (config.theme.backgroundColor) {
      root.style.setProperty('--if-background', config.theme.backgroundColor);
    }
    
    if (config.theme.textColor) {
      root.style.setProperty('--if-text', config.theme.textColor);
    }
    
    if (config.theme.borderColor) {
      root.style.setProperty('--if-border', config.theme.borderColor);
    }
    
    if (config.theme.fontFamily) {
      root.style.setProperty('--if-font-family', config.theme.fontFamily);
    }
    
    if (config.theme.fontSize) {
      root.style.setProperty('--if-font-size', `${config.theme.fontSize}px`);
    }
    
    if (config.theme.borderRadius) {
      root.style.setProperty('--if-border-radius', `${config.theme.borderRadius}px`);
    }
    
    // Apply dark/light mode
    if (config.theme.mode === 'dark') {
      root.classList.add('issueflow-dark');
      root.classList.remove('issueflow-light');
    } else if (config.theme.mode === 'light') {
      root.classList.add('issueflow-light');
      root.classList.remove('issueflow-dark');
    } else if (config.theme.mode === 'auto') {
      // Auto mode - follow system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          root.classList.add('issueflow-dark');
          root.classList.remove('issueflow-light');
        } else {
          root.classList.add('issueflow-light');
          root.classList.remove('issueflow-dark');
        }
      };
      
      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => {
        mediaQuery.removeEventListener('change', updateTheme);
      };
    }
  }, [config.theme]);
  
  // Error boundary for client initialization
  if (initError) {
    if (debug) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #f88',
          borderRadius: '4px',
          color: '#a00',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <strong>IssueFlow Initialization Error:</strong>
          <br />
          {initError}
        </div>
      );
    }
    
    // In production, silently fail and render children without IssueFlow
    console.error('IssueFlow initialization failed:', initError);
  }
  
  // Context value
  const contextValue = useMemo<IssueFlowContextValue>(() => ({
    config,
    client,
    isInitialized: isInitialized && !initError,
    updateConfig,
  }), [config, client, isInitialized, initError, updateConfig]);
  
  return (
    <IssueFlowContext.Provider value={contextValue}>
      {children}
    </IssueFlowContext.Provider>
  );
}
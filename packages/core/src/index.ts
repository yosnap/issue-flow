/**
 * @fileoverview IssueFlow Framework Core
 * 
 * Main entry point for the IssueFlow framework.
 * Exports all public APIs, types, and utilities.
 */

// Main application class
export { IssueFlowApp } from './app';

// Configuration
export { loadConfig, type AppConfig } from './config';

// Core services
export * from './services';

// Middleware
export * from './middleware';

// Controllers
export * from './controllers';

// Types
export * from './types';

// Utilities
export { Logger } from './utils/logger';

// Create convenience function to start the framework
export async function createIssueFlowApp(config?: Partial<import('./config').AppConfig>) {
  const { loadConfig } = await import('./config');
  const { IssueFlowApp } = await import('./app');
  
  const fullConfig = config ? { ...loadConfig(), ...config } : loadConfig();
  
  return new IssueFlowApp(fullConfig);
}

// Version
export const VERSION = '0.1.0';
export const API_VERSION = 'v1';
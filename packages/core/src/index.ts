/**
 * @fileoverview IssueFlow Core Framework Entry Point
 * 
 * This is the main entry point for the IssueFlow core framework.
 * It exports the main classes and utilities needed to run the multi-tenant
 * feedback system.
 */

export * from './services';
export * from './models';
export * from './types';
export * from './middleware';
export * from './utils';
export * from './controllers';
export * from './plugins';

// Main application class
export { IssueFlowApp } from './app';

// Version info
export const VERSION = '0.2.0';
export const API_VERSION = 'v1';
/**
 * @fileoverview CLI Type Definitions
 * 
 * TypeScript definitions for IssueFlow CLI components.
 * Integrates with core framework types and CLI-specific structures.
 */

import type { IssueFlowConfig } from '@issueflow/core';

/**
 * Supported frameworks for project initialization
 */
export type SupportedFramework = 
  | 'react'
  | 'vue'
  | 'nextjs'
  | 'svelte'
  | 'angular';

/**
 * Package managers supported by CLI
 */
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/**
 * Deployment platforms supported
 */
export type DeploymentPlatform = 
  | 'vercel'
  | 'netlify'
  | 'railway'
  | 'heroku'
  | 'docker'
  | 'manual';

/**
 * CLI Configuration structure
 */
export interface CLIConfig {
  /** Current project configuration */
  project?: ProjectConfig;
  /** Global CLI settings */
  global: GlobalConfig;
  /** User preferences */
  preferences: UserPreferences;
}

/**
 * Project-specific configuration
 */
export interface ProjectConfig {
  /** Project identifier */
  id: string;
  /** Project name */
  name: string;
  /** Detected or selected framework */
  framework: SupportedFramework;
  /** Package manager in use */
  packageManager: PackageManager;
  /** IssueFlow configuration */
  issueflow: IssueFlowConfig;
  /** Build and deployment settings */
  build: BuildConfig;
  /** Integration settings */
  integrations: IntegrationConfig;
}

/**
 * Global CLI configuration
 */
export interface GlobalConfig {
  /** API endpoints */
  apiUrl: string;
  /** Authentication token */
  token?: string;
  /** Default organization */
  organizationSlug?: string;
  /** CLI version */
  version: string;
  /** Update check settings */
  updateCheck: {
    enabled: boolean;
    lastCheck?: string;
  };
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Default framework for new projects */
  defaultFramework?: SupportedFramework;
  /** Default package manager */
  defaultPackageManager?: PackageManager;
  /** Analytics consent */
  analyticsEnabled: boolean;
  /** Error reporting consent */
  errorReportingEnabled: boolean;
  /** Preferred deployment platform */
  defaultDeploymentPlatform?: DeploymentPlatform;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Output directory */
  outDir: string;
  /** Public directory */
  publicDir: string;
  /** Build command */
  buildCommand?: string;
  /** Development command */
  devCommand?: string;
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  /** GitHub integration */
  github?: {
    repo: string;
    token: string;
    autoCreateIssues: boolean;
  };
  /** ClickUp integration */
  clickup?: {
    listId: string;
    token: string;
    autoCreateTasks: boolean;
  };
  /** Slack integration */
  slack?: {
    webhook: string;
    channel: string;
  };
  /** Email notifications */
  email?: {
    enabled: boolean;
    recipients: string[];
  };
}

/**
 * Template context for code generation
 */
export interface TemplateContext {
  /** Project information */
  project: {
    name: string;
    framework: SupportedFramework;
    packageManager: PackageManager;
  };
  /** IssueFlow configuration */
  config: IssueFlowConfig;
  /** Framework-specific data */
  framework: {
    dependencies: string[];
    devDependencies: string[];
    scripts: Record<string, string>;
  };
  /** Additional template variables */
  variables: Record<string, any>;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Success status */
  success: boolean;
  /** Result message */
  message: string;
  /** Additional data */
  data?: any;
  /** Error details if failed */
  error?: {
    code: string;
    details: string;
    stack?: string;
  };
}

/**
 * Project initialization options
 */
export interface InitOptions {
  /** Project name */
  name: string;
  /** Target framework */
  framework: SupportedFramework;
  /** Package manager */
  packageManager: PackageManager;
  /** Skip interactive prompts */
  skipPrompts?: boolean;
  /** Use TypeScript */
  typescript?: boolean;
  /** Install dependencies */
  install?: boolean;
  /** Initialize git repository */
  git?: boolean;
}

/**
 * Development server options
 */
export interface DevOptions {
  /** Port number */
  port?: number;
  /** Host address */
  host?: string;
  /** Enable HTTPS */
  https?: boolean;
  /** Open browser */
  open?: boolean;
  /** Watch mode */
  watch?: boolean;
}

/**
 * Build options
 */
export interface BuildOptions {
  /** Output directory */
  outDir?: string;
  /** Production mode */
  production?: boolean;
  /** Source maps */
  sourcemap?: boolean;
  /** Minification */
  minify?: boolean;
}

/**
 * Deployment options
 */
export interface DeployOptions {
  /** Target platform */
  platform: DeploymentPlatform;
  /** Production build */
  build?: boolean;
  /** Environment */
  env?: string;
  /** Custom configuration */
  config?: Record<string, any>;
}

/**
 * Plugin/Adapter management options
 */
export interface PluginOptions {
  /** Plugin name or framework */
  name: string;
  /** Version to install */
  version?: string;
  /** Development dependency */
  dev?: boolean;
  /** Force installation */
  force?: boolean;
}

/**
 * Validation schemas
 */
export interface ValidationSchemas {
  /** Project configuration schema */
  project: any; // Zod schema
  /** Global configuration schema */
  global: any; // Zod schema
  /** Template context schema */
  template: any; // Zod schema
}

/**
 * CLI Context passed to commands
 */
export interface CLIContext {
  /** Current working directory */
  cwd: string;
  /** CLI configuration */
  config: CLIConfig;
  /** Project root (if in project) */
  projectRoot?: string;
  /** Detected package.json */
  packageJson?: any;
  /** Logger instance */
  logger: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
    success: (message: string) => void;
  };
}

/**
 * Framework detection result
 */
export interface FrameworkDetection {
  /** Detected framework */
  framework: SupportedFramework | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detection evidence */
  evidence: {
    /** Dependencies found */
    dependencies: string[];
    /** Configuration files found */
    configFiles: string[];
    /** Folder structure matches */
    structure: string[];
  };
}

/**
 * Template file definition
 */
export interface TemplateFile {
  /** Source template path */
  source: string;
  /** Destination path (relative to project root) */
  destination: string;
  /** Whether to process with template engine */
  template: boolean;
  /** File permissions */
  permissions?: number;
  /** Conditional rendering */
  condition?: (context: TemplateContext) => boolean;
}

/**
 * Framework template definition
 */
export interface FrameworkTemplate {
  /** Framework name */
  name: SupportedFramework;
  /** Template files */
  files: TemplateFile[];
  /** Dependencies to add */
  dependencies: string[];
  /** Dev dependencies to add */
  devDependencies: string[];
  /** Scripts to add to package.json */
  scripts: Record<string, string>;
  /** Post-install commands */
  postInstall?: string[];
}
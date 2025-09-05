/**
 * @fileoverview IssueFlow CLI Package Index
 * 
 * Main export file for the CLI package. Exports public API
 * for programmatic usage and testing.
 */

// Core commands
export { initCommand } from './commands/init';
export { devCommand } from './commands/dev';
export { configCommand } from './commands/config';

// Command registration functions
export { registerInitCommand } from './commands/init';
export { registerDevCommand } from './commands/dev';
export { registerConfigCommand } from './commands/config';

// Utilities
export { configManager, config } from './utils/config';
export { logger, spinner, ui, withSpinner } from './utils/spinner';
export { templateManager } from './utils/templates';
export { validate, ValidationError } from './utils/validation';

// Types
export type {
  SupportedFramework,
  PackageManager,
  DeploymentPlatform,
  CLIConfig,
  ProjectConfig,
  GlobalConfig,
  UserPreferences,
  BuildConfig,
  IntegrationConfig,
  TemplateContext,
  CommandResult,
  InitOptions,
  DevOptions,
  BuildOptions,
  DeployOptions,
  PluginOptions,
  CLIContext,
  FrameworkDetection,
  TemplateFile,
  FrameworkTemplate,
} from './types';

// Main CLI entry points
export { main as runCLI } from './bin/cli';
export { main as runCreate, createProject } from './bin/create';

// Version
export const CLI_VERSION = '0.1.0';
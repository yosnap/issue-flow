/**
 * @fileoverview Config Command
 * 
 * Handles CLI and project configuration management.
 * Provides get, set, list, and reset operations.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import type { Command } from 'commander';
import type { CLIContext, SupportedFramework, PackageManager } from '../types';
import { configManager, config } from '../utils/config';
import { logger, ui } from '../utils/spinner';
import { validate } from '../utils/validation';

/**
 * Configuration commands
 */
type ConfigCommand = 'get' | 'set' | 'list' | 'reset' | 'setup';

/**
 * Configuration keys with descriptions and validation
 */
const CONFIG_KEYS = {
  // Global configuration
  'global.apiUrl': {
    description: 'IssueFlow API URL',
    type: 'string',
    validate: (value: string) => validate.UrlSchema.safeParse(value).success,
  },
  'global.token': {
    description: 'Authentication token',
    type: 'string',
    sensitive: true,
  },
  'global.organizationSlug': {
    description: 'Default organization slug',
    type: 'string',
    validate: (value: string) => validate.OrganizationSlugSchema.safeParse(value).success,
  },
  
  // User preferences
  'preferences.defaultFramework': {
    description: 'Default framework for new projects',
    type: 'enum',
    options: ['react', 'vue', 'nextjs', 'svelte', 'angular'],
  },
  'preferences.defaultPackageManager': {
    description: 'Default package manager',
    type: 'enum',
    options: ['npm', 'yarn', 'pnpm', 'bun'],
  },
  'preferences.analyticsEnabled': {
    description: 'Enable analytics collection',
    type: 'boolean',
  },
  'preferences.errorReportingEnabled': {
    description: 'Enable error reporting',
    type: 'boolean',
  },
  
  // Project configuration (if in project)
  'project.name': {
    description: 'Project name',
    type: 'string',
    projectOnly: true,
  },
  'project.framework': {
    description: 'Project framework',
    type: 'enum',
    options: ['react', 'vue', 'nextjs', 'svelte', 'angular'],
    projectOnly: true,
  },
  'project.issueflow.projectId': {
    description: 'IssueFlow project ID',
    type: 'string',
    projectOnly: true,
    validate: (value: string) => validate.ProjectIdSchema.safeParse(value).success,
  },
  'project.issueflow.apiUrl': {
    description: 'Project-specific API URL',
    type: 'string',
    projectOnly: true,
    validate: (value: string) => validate.UrlSchema.safeParse(value).success,
  },
};

/**
 * Get configuration value by key path
 */
function getConfigValue(keyPath: string): any {
  const keys = keyPath.split('.');
  let current = configManager.getConfig();
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as any)[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Set configuration value by key path
 */
function setConfigValue(keyPath: string, value: any): void {
  const keys = keyPath.split('.');
  const lastKey = keys.pop()!;
  const parentPath = keys.join('.');
  
  if (parentPath === 'global') {
    const global = configManager.getGlobal();
    (global as any)[lastKey] = value;
    configManager.setGlobal(global);
  } else if (parentPath === 'preferences') {
    const preferences = configManager.getPreferences();
    (preferences as any)[lastKey] = value;
    configManager.setPreferences(preferences);
  } else if (parentPath.startsWith('project')) {
    const project = configManager.getProject();
    if (!project) {
      throw new Error('No project configuration found. Run "issueflow init" first.');
    }
    
    // Navigate to the correct nested object
    let current = project as any;
    const projectKeys = keys.slice(1); // Remove 'project' prefix
    
    for (const key of projectKeys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    configManager.setProject(project);
  } else {
    throw new Error(`Invalid configuration key: ${keyPath}`);
  }
}

/**
 * Format configuration value for display
 */
function formatValue(value: any, sensitive: boolean = false): string {
  if (value === undefined || value === null) {
    return '<not set>';
  }
  
  if (sensitive && value) {
    return '*'.repeat(Math.min(value.length, 8));
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

/**
 * Parse value from string input
 */
function parseValue(input: string, type: string): any {
  switch (type) {
    case 'boolean':
      return input.toLowerCase() === 'true' || input === '1';
    case 'number':
      const num = Number(input);
      if (isNaN(num)) {
        throw new Error('Value must be a valid number');
      }
      return num;
    case 'string':
    default:
      return input;
  }
}

/**
 * List all configuration keys and values
 */
async function listConfig(context: CLIContext): Promise<void> {
  const isInProject = configManager.hasProject();
  
  ui.header('📋 IssueFlow Configuration');
  
  // Global configuration
  console.log('');
  ui.keyValue('API URL', config.getApiUrl());
  ui.keyValue('Authenticated', config.isAuthenticated() ? 'Yes' : 'No');
  ui.keyValue('Organization', config.getOrganizationSlug() || '<not set>');
  
  // User preferences
  console.log('');
  logger.info('User Preferences:');
  const preferences = configManager.getPreferences();
  ui.keyValue('  Default Framework', preferences.defaultFramework || '<not set>');
  ui.keyValue('  Default Package Manager', preferences.defaultPackageManager || '<not set>');
  ui.keyValue('  Analytics Enabled', preferences.analyticsEnabled ? 'Yes' : 'No');
  ui.keyValue('  Error Reporting', preferences.errorReportingEnabled ? 'Yes' : 'No');
  
  // Project configuration (if available)
  if (isInProject) {
    const project = configManager.getProject()!;
    console.log('');
    logger.info('Project Configuration:');
    ui.keyValue('  Name', project.name);
    ui.keyValue('  Framework', project.framework);
    ui.keyValue('  Package Manager', project.packageManager);
    ui.keyValue('  Project ID', project.issueflow.projectId);
    ui.keyValue('  API URL', project.issueflow.apiUrl || '<inherited>');
  }
  
  // Configuration files
  console.log('');
  logger.info('Configuration Files:');
  ui.keyValue('  Global Config', configManager.getConfigPath());
  
  const projectConfigPath = configManager.getProjectConfigPath();
  if (projectConfigPath) {
    ui.keyValue('  Project Config', projectConfigPath);
  }
}

/**
 * Get specific configuration value
 */
async function getConfig(keyPath: string, context: CLIContext): Promise<void> {
  const keyConfig = CONFIG_KEYS[keyPath as keyof typeof CONFIG_KEYS];
  
  if (!keyConfig) {
    ui.error(`Unknown configuration key: ${keyPath}`);
    logger.info('Run "issueflow config list" to see available keys');
    return;
  }
  
  if (keyConfig.projectOnly && !configManager.hasProject()) {
    ui.error('This configuration key is only available in project context');
    logger.info('Run "issueflow init" to initialize a project');
    return;
  }
  
  const value = getConfigValue(keyPath);
  const formattedValue = formatValue(value, keyConfig.sensitive);
  
  ui.keyValue(keyPath, formattedValue);
}

/**
 * Set configuration value
 */
async function setConfig(keyPath: string, value: string, context: CLIContext): Promise<void> {
  const keyConfig = CONFIG_KEYS[keyPath as keyof typeof CONFIG_KEYS];
  
  if (!keyConfig) {
    ui.error(`Unknown configuration key: ${keyPath}`);
    logger.info('Run "issueflow config list" to see available keys');
    return;
  }
  
  if (keyConfig.projectOnly && !configManager.hasProject()) {
    ui.error('This configuration key is only available in project context');
    logger.info('Run "issueflow init" to initialize a project');
    return;
  }
  
  try {
    // Parse value according to type
    const parsedValue = parseValue(value, keyConfig.type);
    
    // Validate if validator exists
    if (keyConfig.validate && !keyConfig.validate(parsedValue)) {
      throw new Error('Invalid value format');
    }
    
    // Validate enum options
    if (keyConfig.type === 'enum' && keyConfig.options && !keyConfig.options.includes(parsedValue)) {
      throw new Error(`Value must be one of: ${keyConfig.options.join(', ')}`);
    }
    
    // Set the value
    setConfigValue(keyPath, parsedValue);
    
    ui.success(`Set ${keyPath} = ${formatValue(parsedValue, keyConfig.sensitive)}`);
    
  } catch (error) {
    ui.error(`Failed to set configuration: ${error.message}`);
  }
}

/**
 * Interactive configuration setup wizard
 */
async function setupConfig(context: CLIContext): Promise<void> {
  ui.header('⚙️ IssueFlow Configuration Setup');
  
  const questions = [];
  
  // Global configuration
  if (!config.getToken()) {
    questions.push({
      type: 'input',
      name: 'token',
      message: 'Authentication token (optional):',
      validate: (input: string) => input.length === 0 || input.length > 10,
    });
  }
  
  if (!config.getOrganizationSlug()) {
    questions.push({
      type: 'input',
      name: 'organizationSlug',
      message: 'Organization slug (optional):',
      validate: (input: string) => {
        if (input.length === 0) return true;
        return validate.OrganizationSlugSchema.safeParse(input).success || 'Invalid organization slug format';
      },
    });
  }
  
  // User preferences
  questions.push({
    type: 'list',
    name: 'defaultFramework',
    message: 'Default framework for new projects:',
    default: config.getDefaultFramework() || 'react',
    choices: [
      { name: 'React', value: 'react' },
      { name: 'Vue', value: 'vue' },
      { name: 'Next.js', value: 'nextjs' },
      { name: 'Svelte', value: 'svelte' },
      { name: 'Angular', value: 'angular' },
    ],
  });
  
  questions.push({
    type: 'list',
    name: 'defaultPackageManager',
    message: 'Default package manager:',
    default: config.getDefaultPackageManager() || 'npm',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'Yarn', value: 'yarn' },
      { name: 'pnpm', value: 'pnpm' },
      { name: 'Bun', value: 'bun' },
    ],
  });
  
  questions.push({
    type: 'confirm',
    name: 'analyticsEnabled',
    message: 'Enable analytics to help improve IssueFlow?',
    default: config.isAnalyticsEnabled(),
  });
  
  questions.push({
    type: 'confirm',
    name: 'errorReportingEnabled',
    message: 'Enable error reporting for debugging?',
    default: config.isErrorReportingEnabled(),
  });
  
  const answers = await inquirer.prompt(questions);
  
  // Apply configuration
  if (answers.token) {
    config.setToken(answers.token);
  }
  
  configManager.setGlobal({
    organizationSlug: answers.organizationSlug || undefined,
  });
  
  configManager.setPreferences({
    defaultFramework: answers.defaultFramework,
    defaultPackageManager: answers.defaultPackageManager,
    analyticsEnabled: answers.analyticsEnabled,
    errorReportingEnabled: answers.errorReportingEnabled,
  });
  
  ui.success('Configuration updated successfully!');
}

/**
 * Reset configuration
 */
async function resetConfig(scope: 'global' | 'project' | 'all', context: CLIContext): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to reset ${scope} configuration?`,
      default: false,
    },
  ]);
  
  if (!confirm) {
    logger.info('Reset cancelled');
    return;
  }
  
  switch (scope) {
    case 'global':
      configManager.reset();
      ui.success('Global configuration reset to defaults');
      break;
    
    case 'project':
      if (!configManager.hasProject()) {
        ui.error('No project configuration found');
        return;
      }
      configManager.resetProject();
      ui.success('Project configuration reset');
      break;
    
    case 'all':
      configManager.reset();
      configManager.resetProject();
      ui.success('All configuration reset to defaults');
      break;
  }
}

/**
 * Main config command handler
 */
export async function configCommand(
  command: ConfigCommand,
  keyOrScope?: string,
  value?: string,
  context?: CLIContext
): Promise<void> {
  try {
    const ctx = context || {
      cwd: process.cwd(),
      config: configManager.getConfig(),
      logger,
    };
    
    switch (command) {
      case 'list':
        await listConfig(ctx);
        break;
      
      case 'get':
        if (!keyOrScope) {
          ui.error('Key path is required for get command');
          return;
        }
        await getConfig(keyOrScope, ctx);
        break;
      
      case 'set':
        if (!keyOrScope || !value) {
          ui.error('Key path and value are required for set command');
          return;
        }
        await setConfig(keyOrScope, value, ctx);
        break;
      
      case 'setup':
        await setupConfig(ctx);
        break;
      
      case 'reset':
        const scope = (keyOrScope as 'global' | 'project' | 'all') || 'all';
        await resetConfig(scope, ctx);
        break;
      
      default:
        ui.error(`Unknown config command: ${command}`);
        break;
    }
    
  } catch (error) {
    ui.error(`Configuration command failed: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
}

/**
 * Register config command with Commander
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage IssueFlow configuration');
  
  configCmd
    .command('list')
    .description('List all configuration values')
    .action(() => configCommand('list'));
  
  configCmd
    .command('get <key>')
    .description('Get configuration value by key')
    .action((key) => configCommand('get', key));
  
  configCmd
    .command('set <key> <value>')
    .description('Set configuration value')
    .action((key, value) => configCommand('set', key, value));
  
  configCmd
    .command('setup')
    .description('Interactive configuration setup')
    .action(() => configCommand('setup'));
  
  configCmd
    .command('reset [scope]')
    .description('Reset configuration (scope: global, project, all)')
    .action((scope) => configCommand('reset', scope || 'all'));
}
/**
 * @fileoverview CLI Configuration Management
 * 
 * Handles persistent configuration storage and management
 * for IssueFlow CLI using the conf package.
 */

import Conf from 'conf';
import { z } from 'zod';
import type { 
  CLIConfig, 
  GlobalConfig, 
  ProjectConfig, 
  UserPreferences 
} from '../types';

/**
 * Validation schemas
 */
const GlobalConfigSchema = z.object({
  apiUrl: z.string().url(),
  token: z.string().optional(),
  organizationSlug: z.string().optional(),
  version: z.string(),
  updateCheck: z.object({
    enabled: z.boolean(),
    lastCheck: z.string().optional(),
  }),
});

const UserPreferencesSchema = z.object({
  defaultFramework: z.enum(['react', 'vue', 'nextjs', 'svelte', 'angular']).optional(),
  defaultPackageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']).optional(),
  analyticsEnabled: z.boolean(),
  errorReportingEnabled: z.boolean(),
  defaultDeploymentPlatform: z.enum(['vercel', 'netlify', 'railway', 'heroku', 'docker', 'manual']).optional(),
});

const CLIConfigSchema = z.object({
  project: z.any().optional(), // ProjectConfig is complex, validate separately
  global: GlobalConfigSchema,
  preferences: UserPreferencesSchema,
});

/**
 * Default configuration values
 */
const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  apiUrl: 'https://api.issueflow.dev',
  version: '0.1.0',
  updateCheck: {
    enabled: true,
  },
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  analyticsEnabled: true,
  errorReportingEnabled: true,
};

const DEFAULT_CLI_CONFIG: CLIConfig = {
  global: DEFAULT_GLOBAL_CONFIG,
  preferences: DEFAULT_USER_PREFERENCES,
};

/**
 * Configuration manager class
 */
export class ConfigManager {
  private conf: Conf<CLIConfig>;
  private projectConf: Conf<ProjectConfig> | null = null;

  constructor() {
    this.conf = new Conf<CLIConfig>({
      projectName: 'issueflow-cli',
      defaults: DEFAULT_CLI_CONFIG,
      schema: CLIConfigSchema as any,
    });
  }

  /**
   * Get global configuration
   */
  getGlobal(): GlobalConfig {
    return this.conf.get('global');
  }

  /**
   * Set global configuration
   */
  setGlobal(config: Partial<GlobalConfig>): void {
    const current = this.getGlobal();
    const updated = { ...current, ...config };
    
    // Validate before saving
    const result = GlobalConfigSchema.safeParse(updated);
    if (!result.success) {
      throw new Error(`Invalid global config: ${result.error.message}`);
    }
    
    this.conf.set('global', updated);
  }

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    return this.conf.get('preferences');
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...preferences };
    
    // Validate before saving
    const result = UserPreferencesSchema.safeParse(updated);
    if (!result.success) {
      throw new Error(`Invalid preferences: ${result.error.message}`);
    }
    
    this.conf.set('preferences', updated);
  }

  /**
   * Get complete configuration
   */
  getConfig(): CLIConfig {
    return this.conf.store;
  }

  /**
   * Initialize project configuration
   */
  initProject(projectRoot: string, config: ProjectConfig): void {
    this.projectConf = new Conf<ProjectConfig>({
      projectName: 'issueflow-project',
      cwd: projectRoot,
      configName: '.issueflow',
      defaults: config,
    });
    
    // Set project in global config
    this.conf.set('project', config);
  }

  /**
   * Get project configuration
   */
  getProject(): ProjectConfig | null {
    if (this.projectConf) {
      return this.projectConf.store;
    }
    return this.conf.get('project') || null;
  }

  /**
   * Set project configuration
   */
  setProject(config: Partial<ProjectConfig>): void {
    if (!this.projectConf) {
      throw new Error('No project initialized. Run "issueflow init" first.');
    }
    
    const current = this.getProject();
    if (!current) {
      throw new Error('No current project configuration found.');
    }
    
    const updated = { ...current, ...config };
    this.projectConf.set(updated);
    this.conf.set('project', updated);
  }

  /**
   * Check if inside a project
   */
  hasProject(): boolean {
    return this.getProject() !== null;
  }

  /**
   * Get configuration value by key path
   */
  get<T = any>(keyPath: string): T {
    return this.conf.get(keyPath as any);
  }

  /**
   * Set configuration value by key path
   */
  set(keyPath: string, value: any): void {
    this.conf.set(keyPath as any, value);
  }

  /**
   * Delete configuration key
   */
  delete(keyPath: string): void {
    this.conf.delete(keyPath as any);
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.conf.clear();
  }

  /**
   * Reset project configuration
   */
  resetProject(): void {
    if (this.projectConf) {
      this.projectConf.clear();
    }
    this.conf.delete('project');
    this.projectConf = null;
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.conf.path;
  }

  /**
   * Get project configuration file path
   */
  getProjectConfigPath(): string | null {
    return this.projectConf?.path || null;
  }

  /**
   * Validate current configuration
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      CLIConfigSchema.parse(this.conf.store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(`Configuration validation error: ${error.message}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Singleton configuration manager instance
 */
export const configManager = new ConfigManager();

/**
 * Utility functions for common config operations
 */
export const config = {
  /**
   * Get API URL with fallback
   */
  getApiUrl(): string {
    return configManager.getGlobal().apiUrl;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!configManager.getGlobal().token;
  },

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return configManager.getGlobal().token || null;
  },

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    configManager.setGlobal({ token });
  },

  /**
   * Remove authentication token
   */
  removeToken(): void {
    configManager.setGlobal({ token: undefined });
  },

  /**
   * Get organization slug
   */
  getOrganizationSlug(): string | null {
    return configManager.getGlobal().organizationSlug || null;
  },

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return configManager.getPreferences().analyticsEnabled;
  },

  /**
   * Check if error reporting is enabled
   */
  isErrorReportingEnabled(): boolean {
    return configManager.getPreferences().errorReportingEnabled;
  },

  /**
   * Get default framework preference
   */
  getDefaultFramework(): string | null {
    return configManager.getPreferences().defaultFramework || null;
  },

  /**
   * Get default package manager preference
   */
  getDefaultPackageManager(): string | null {
    return configManager.getPreferences().defaultPackageManager || null;
  },
};
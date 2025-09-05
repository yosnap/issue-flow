/**
 * @fileoverview Validation Utilities
 * 
 * Provides validation schemas and utilities for CLI input validation.
 * Uses Zod for schema validation with custom error messages.
 */

import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import type { SupportedFramework, PackageManager, DeploymentPlatform } from '../types';

/**
 * Common validation patterns
 */
const PATTERNS = {
  PROJECT_NAME: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  PACKAGE_NAME: /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
  DOMAIN_NAME: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  PROJECT_ID: /^[a-zA-Z0-9-_]+$/,
  ORGANIZATION_SLUG: /^[a-z0-9-]+$/,
};

/**
 * Supported frameworks enum schema
 */
export const SupportedFrameworkSchema = z.enum(['react', 'vue', 'nextjs', 'svelte', 'angular']);

/**
 * Package manager enum schema
 */
export const PackageManagerSchema = z.enum(['npm', 'yarn', 'pnpm', 'bun']);

/**
 * Deployment platform enum schema
 */
export const DeploymentPlatformSchema = z.enum(['vercel', 'netlify', 'railway', 'heroku', 'docker', 'manual']);

/**
 * Project name validation
 */
export const ProjectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(50, 'Project name must be less than 50 characters')
  .regex(PATTERNS.PROJECT_NAME, 'Project name must contain only lowercase letters, numbers, and hyphens')
  .refine(
    (name) => !name.startsWith('-') && !name.endsWith('-'),
    'Project name cannot start or end with a hyphen'
  );

/**
 * Package name validation
 */
export const PackageNameSchema = z
  .string()
  .min(1, 'Package name is required')
  .max(214, 'Package name must be less than 214 characters')
  .regex(PATTERNS.PACKAGE_NAME, 'Invalid package name format');

/**
 * Project ID validation
 */
export const ProjectIdSchema = z
  .string()
  .min(1, 'Project ID is required')
  .max(50, 'Project ID must be less than 50 characters')
  .regex(PATTERNS.PROJECT_ID, 'Project ID must contain only alphanumeric characters, hyphens, and underscores');

/**
 * Organization slug validation
 */
export const OrganizationSlugSchema = z
  .string()
  .min(1, 'Organization slug is required')
  .max(50, 'Organization slug must be less than 50 characters')
  .regex(PATTERNS.ORGANIZATION_SLUG, 'Organization slug must contain only lowercase letters, numbers, and hyphens');

/**
 * URL validation
 */
export const UrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must start with http:// or https://'
  );

/**
 * Domain name validation
 */
export const DomainSchema = z
  .string()
  .min(1, 'Domain name is required')
  .max(253, 'Domain name must be less than 253 characters')
  .regex(PATTERNS.DOMAIN_NAME, 'Invalid domain name format');

/**
 * Port validation
 */
export const PortSchema = z
  .number()
  .int('Port must be an integer')
  .min(1, 'Port must be greater than 0')
  .max(65535, 'Port must be less than 65536');

/**
 * Email validation
 */
export const EmailSchema = z
  .string()
  .email('Must be a valid email address');

/**
 * Path validation
 */
export const PathSchema = z
  .string()
  .min(1, 'Path is required')
  .refine(
    (filepath) => !path.isAbsolute(filepath) || fs.pathExistsSync(path.dirname(filepath)),
    'Parent directory must exist'
  );

/**
 * Environment variable name validation
 */
export const EnvVarNameSchema = z
  .string()
  .min(1, 'Environment variable name is required')
  .regex(/^[A-Z_][A-Z0-9_]*$/, 'Environment variable name must contain only uppercase letters, numbers, and underscores');

/**
 * Git repository URL validation
 */
export const GitRepoSchema = z
  .string()
  .min(1, 'Git repository URL is required')
  .refine(
    (url) => {
      // GitHub SSH format: git@github.com:owner/repo.git
      const sshPattern = /^git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\.git$/;
      // GitHub HTTPS format: https://github.com/owner/repo.git
      const httpsPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/;
      
      return sshPattern.test(url) || httpsPattern.test(url);
    },
    'Must be a valid GitHub repository URL'
  );

/**
 * Validation utility functions
 */
export const validate = {
  /**
   * Check if a directory is empty
   */
  async isDirectoryEmpty(dirPath: string): Promise<boolean> {
    try {
      const files = await fs.readdir(dirPath);
      return files.length === 0;
    } catch {
      return true; // Directory doesn't exist, so it's "empty"
    }
  },

  /**
   * Check if a path exists and is a directory
   */
  async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  },

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  },

  /**
   * Validate project name and check availability
   */
  async validateProjectName(name: string, targetDir?: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Schema validation
    const schemaResult = ProjectNameSchema.safeParse(name);
    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(e => e.message));
    }
    
    // Check if directory already exists
    if (targetDir) {
      const fullPath = path.resolve(targetDir, name);
      if (await fs.pathExists(fullPath)) {
        const isEmpty = await validate.isDirectoryEmpty(fullPath);
        if (!isEmpty) {
          errors.push(`Directory '${name}' already exists and is not empty`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate framework choice
   */
  validateFramework(framework: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const result = SupportedFrameworkSchema.safeParse(framework);
    
    if (!result.success) {
      errors.push(`Unsupported framework: ${framework}. Supported: react, vue, nextjs, svelte, angular`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate package manager
   */
  validatePackageManager(packageManager: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const result = PackageManagerSchema.safeParse(packageManager);
    
    if (!result.success) {
      errors.push(`Unsupported package manager: ${packageManager}. Supported: npm, yarn, pnpm, bun`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate complete project configuration
   */
  async validateProjectConfig(config: {
    name: string;
    framework: string;
    packageManager: string;
    targetDir?: string;
  }): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const allErrors: string[] = [];
    
    // Validate project name
    const nameResult = await validate.validateProjectName(config.name, config.targetDir);
    allErrors.push(...nameResult.errors);
    
    // Validate framework
    const frameworkResult = validate.validateFramework(config.framework);
    allErrors.push(...frameworkResult.errors);
    
    // Validate package manager
    const packageManagerResult = validate.validatePackageManager(config.packageManager);
    allErrors.push(...packageManagerResult.errors);
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  },

  /**
   * Sanitize user input for file paths
   */
  sanitizePath(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9-_./]/g, '') // Remove invalid characters
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .replace(/\/{2,}/g, '/') // Replace multiple slashes
      .trim();
  },

  /**
   * Generate a safe project name from user input
   */
  sanitizeProjectName(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
      .replace(/-{2,}/g, '-') // Replace multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50); // Limit length
  },
};

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public errors: string[];

  constructor(errors: string[]) {
    const message = `Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validation result helper
 */
export function createValidationResult(
  isValid: boolean,
  errors: string[] = []
): { isValid: boolean; errors: string[] } {
  return { isValid, errors };
}
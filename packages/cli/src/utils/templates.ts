/**
 * @fileoverview Template Management
 * 
 * Handles code generation from templates using Handlebars.
 * Supports framework-specific templates and custom variables.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import type { 
  TemplateContext, 
  FrameworkTemplate, 
  TemplateFile,
  SupportedFramework 
} from '../types';
import { logger } from './spinner';

/**
 * Template engine with custom helpers
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templatesDir: string;

  constructor(templatesDir: string) {
    this.handlebars = Handlebars.create();
    this.templatesDir = templatesDir;
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper for conditional rendering
    this.handlebars.registerHelper('if_eq', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // Helper for string case conversion
    this.handlebars.registerHelper('camelCase', function(str: string) {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('pascalCase', function(str: string) {
      return str.replace(/(?:^|-)([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('kebabCase', function(str: string) {
      return str.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase());
    });

    // Helper for JSON stringification
    this.handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });

    // Helper for array joining
    this.handlebars.registerHelper('join', function(array: string[], separator: string) {
      return array.join(separator || ', ');
    });

    // Helper for conditional includes
    this.handlebars.registerHelper('includes', function(array: any[], item: any) {
      return array.includes(item);
    });
  }

  /**
   * Compile a template string
   */
  compile(templateString: string): HandlebarsTemplateDelegate {
    return this.handlebars.compile(templateString);
  }

  /**
   * Render a template file with context
   */
  async renderFile(templatePath: string, context: TemplateContext): Promise<string> {
    const fullPath = path.resolve(this.templatesDir, templatePath);
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`);
    }
    
    const templateContent = await fs.readFile(fullPath, 'utf-8');
    const template = this.compile(templateContent);
    
    return template(context);
  }

  /**
   * Render a template string with context
   */
  renderString(templateString: string, context: TemplateContext): string {
    const template = this.compile(templateString);
    return template(context);
  }

  /**
   * Get template directory path
   */
  getTemplatesDir(): string {
    return this.templatesDir;
  }
}

/**
 * Framework template definitions
 */
export const FRAMEWORK_TEMPLATES: Record<SupportedFramework, FrameworkTemplate> = {
  react: {
    name: 'react',
    files: [
      {
        source: 'react/issueflow.config.js.hbs',
        destination: 'issueflow.config.js',
        template: true,
      },
      {
        source: 'react/components/IssueFlowWidget.tsx.hbs',
        destination: 'src/components/IssueFlowWidget.tsx',
        template: true,
      },
      {
        source: 'react/hooks/useIssueFlow.ts.hbs',
        destination: 'src/hooks/useIssueFlow.ts',
        template: true,
      },
      {
        source: 'base/env.example.hbs',
        destination: '.env.example',
        template: true,
      },
    ],
    dependencies: ['@issueflow/react', '@issueflow/sdk'],
    devDependencies: [],
    scripts: {
      'issueflow:dev': 'issueflow dev',
      'issueflow:build': 'issueflow build',
    },
    postInstall: [
      'echo "✨ React integration configured!"',
      'echo "📖 Check the README for next steps."',
    ],
  },
  
  vue: {
    name: 'vue',
    files: [
      {
        source: 'vue/issueflow.config.js.hbs',
        destination: 'issueflow.config.js',
        template: true,
      },
      {
        source: 'vue/components/IssueFlowWidget.vue.hbs',
        destination: 'src/components/IssueFlowWidget.vue',
        template: true,
      },
      {
        source: 'vue/composables/useIssueFlow.ts.hbs',
        destination: 'src/composables/useIssueFlow.ts',
        template: true,
      },
      {
        source: 'base/env.example.hbs',
        destination: '.env.example',
        template: true,
      },
    ],
    dependencies: ['@issueflow/vue', '@issueflow/sdk'],
    devDependencies: [],
    scripts: {
      'issueflow:dev': 'issueflow dev',
      'issueflow:build': 'issueflow build',
    },
    postInstall: [
      'echo "✨ Vue integration configured!"',
      'echo "📖 Check the README for next steps."',
    ],
  },
  
  nextjs: {
    name: 'nextjs',
    files: [
      {
        source: 'nextjs/issueflow.config.js.hbs',
        destination: 'issueflow.config.js',
        template: true,
      },
      {
        source: 'nextjs/components/IssueFlowWidget.tsx.hbs',
        destination: 'components/IssueFlowWidget.tsx',
        template: true,
      },
      {
        source: 'nextjs/hooks/useIssueFlow.ts.hbs',
        destination: 'hooks/useIssueFlow.ts',
        template: true,
      },
      {
        source: 'nextjs/pages/api/issueflow/[...slug].ts.hbs',
        destination: 'pages/api/issueflow/[...slug].ts',
        template: true,
        condition: (context) => !context.project.name.includes('app-router'),
      },
      {
        source: 'nextjs/app/api/issueflow/[...slug]/route.ts.hbs',
        destination: 'app/api/issueflow/[...slug]/route.ts',
        template: true,
        condition: (context) => context.project.name.includes('app-router'),
      },
      {
        source: 'base/env.example.hbs',
        destination: '.env.example',
        template: true,
      },
    ],
    dependencies: ['@issueflow/react', '@issueflow/sdk'],
    devDependencies: [],
    scripts: {
      'issueflow:dev': 'issueflow dev',
      'issueflow:build': 'issueflow build',
    },
    postInstall: [
      'echo "✨ Next.js integration configured!"',
      'echo "📖 Check the README for next steps."',
    ],
  },
  
  svelte: {
    name: 'svelte',
    files: [
      {
        source: 'svelte/issueflow.config.js.hbs',
        destination: 'issueflow.config.js',
        template: true,
      },
      {
        source: 'svelte/components/IssueFlowWidget.svelte.hbs',
        destination: 'src/components/IssueFlowWidget.svelte',
        template: true,
      },
      {
        source: 'svelte/stores/issueflow.ts.hbs',
        destination: 'src/stores/issueflow.ts',
        template: true,
      },
      {
        source: 'base/env.example.hbs',
        destination: '.env.example',
        template: true,
      },
    ],
    dependencies: ['@issueflow/svelte', '@issueflow/sdk'],
    devDependencies: [],
    scripts: {
      'issueflow:dev': 'issueflow dev',
      'issueflow:build': 'issueflow build',
    },
    postInstall: [
      'echo "✨ Svelte integration configured!"',
      'echo "📖 Check the README for next steps."',
    ],
  },
  
  angular: {
    name: 'angular',
    files: [
      {
        source: 'angular/issueflow.config.js.hbs',
        destination: 'issueflow.config.js',
        template: true,
      },
      {
        source: 'angular/components/issue-flow-widget.component.ts.hbs',
        destination: 'src/app/components/issue-flow-widget/issue-flow-widget.component.ts',
        template: true,
      },
      {
        source: 'angular/services/issue-flow.service.ts.hbs',
        destination: 'src/app/services/issue-flow.service.ts',
        template: true,
      },
      {
        source: 'base/env.example.hbs',
        destination: '.env.example',
        template: true,
      },
    ],
    dependencies: ['@issueflow/angular', '@issueflow/sdk'],
    devDependencies: ['@angular/animations'],
    scripts: {
      'issueflow:dev': 'issueflow dev',
      'issueflow:build': 'issueflow build',
    },
    postInstall: [
      'echo "✨ Angular integration configured!"',
      'echo "📖 Add IssueFlowModule to your app.module.ts or use standalone components"',
      'echo "📖 Import the generated component in your application"',
      'echo "📖 Check the README for next steps."',
    ],
  },
};

/**
 * Template manager for processing framework templates
 */
export class TemplateManager {
  private engine: TemplateEngine;

  constructor(templatesDir?: string) {
    // Default to templates directory relative to CLI package
    const defaultTemplatesDir = templatesDir || path.resolve('.', 'templates');
    this.engine = new TemplateEngine(defaultTemplatesDir);
  }

  /**
   * Generate files from framework template
   */
  async generateFrameworkFiles(
    framework: SupportedFramework,
    context: TemplateContext,
    outputDir: string
  ): Promise<void> {
    const template = FRAMEWORK_TEMPLATES[framework];
    
    if (!template) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    logger.debug(`Generating ${template.files.length} files for ${framework}`);

    for (const file of template.files) {
      // Check condition if specified
      if (file.condition && !file.condition(context)) {
        logger.debug(`Skipping ${file.destination} (condition not met)`);
        continue;
      }

      const outputPath = path.resolve(outputDir, file.destination);
      await fs.ensureDir(path.dirname(outputPath));

      if (file.template) {
        // Process template
        const content = await this.engine.renderFile(file.source, context);
        await fs.writeFile(outputPath, content, 'utf-8');
      } else {
        // Copy file directly
        const sourcePath = path.resolve(this.engine.getTemplatesDir(), file.source);
        await fs.copy(sourcePath, outputPath);
      }

      // Set permissions if specified
      if (file.permissions) {
        await fs.chmod(outputPath, file.permissions);
      }

      logger.debug(`Generated: ${file.destination}`);
    }
  }

  /**
   * Get framework template definition
   */
  getFrameworkTemplate(framework: SupportedFramework): FrameworkTemplate {
    const template = FRAMEWORK_TEMPLATES[framework];
    
    if (!template) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    return template;
  }

  /**
   * Check if template files exist
   */
  async validateTemplates(framework: SupportedFramework): Promise<boolean> {
    const template = FRAMEWORK_TEMPLATES[framework];
    
    if (!template) {
      return false;
    }

    for (const file of template.files) {
      const templatePath = path.resolve(this.engine.getTemplatesDir(), file.source);
      
      if (!await fs.pathExists(templatePath)) {
        logger.debug(`Template file missing: ${templatePath}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Create template context from project data
   */
  createContext(
    projectName: string,
    framework: SupportedFramework,
    packageManager: string,
    additionalContext: Record<string, any> = {}
  ): TemplateContext {
    const template = FRAMEWORK_TEMPLATES[framework];
    
    return {
      project: {
        name: projectName,
        framework,
        packageManager: packageManager as any,
      },
      config: {
        projectId: `${projectName}-${Date.now()}`,
        apiUrl: 'https://api.issueflow.dev',
        widget: {
          position: 'bottom-right',
          trigger: 'button',
          triggerText: 'Feedback',
        },
        theme: {
          mode: 'auto',
          primaryColor: '#3b82f6',
          borderRadius: 8,
        },
        behavior: {
          captureConsoleErrors: false,
          captureUnhandledRejections: false,
          requireEmail: false,
          allowAnonymous: true,
          showSuccessMessage: true,
          autoClose: true,
          autoCloseDelay: 3000,
        },
      },
      framework: {
        dependencies: template.dependencies,
        devDependencies: template.devDependencies,
        scripts: template.scripts,
      },
      variables: {
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        ...additionalContext,
      },
    };
  }
}

/**
 * Default template manager instance
 */
export const templateManager = new TemplateManager();
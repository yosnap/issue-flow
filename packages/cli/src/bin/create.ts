#!/usr/bin/env node

/**
 * @fileoverview Create IssueFlow Project
 * 
 * Binary for creating new projects with IssueFlow integration.
 * Similar to create-react-app, create-vue, etc.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger, ui, withSpinner } from '../utils/spinner';
import { configManager } from '../utils/config';
import { initCommand } from '../commands/init';
import { validate, ValidationError } from '../utils/validation';
import type { 
  InitOptions, 
  SupportedFramework, 
  PackageManager, 
  CLIContext 
} from '../types';

/**
 * Get package version
 */
function getVersion(): string {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '0.1.0';
  } catch {
    return '0.1.0';
  }
}

/**
 * Project creation options
 */
interface CreateOptions {
  framework?: SupportedFramework;
  packageManager?: PackageManager;
  typescript?: boolean;
  git?: boolean;
  install?: boolean;
  template?: string;
  force?: boolean;
}

/**
 * Validate project name and directory
 */
async function validateProjectName(name: string, targetDir?: string): Promise<void> {
  const result = await validate.validateProjectName(name, targetDir);
  
  if (!result.isValid) {
    throw new ValidationError(result.errors);
  }
}

/**
 * Create project directory structure
 */
async function createProjectDirectory(name: string, options: CreateOptions): Promise<string> {
  const targetDir = resolve(process.cwd(), name);
  
  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    if (!options.force) {
      const stats = await fs.stat(targetDir);
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(targetDir);
        
        if (files.length > 0) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `Directory "${name}" already exists and is not empty. Overwrite?`,
              default: false,
            },
          ]);
          
          if (!overwrite) {
            logger.info('Project creation cancelled');
            process.exit(0);
          }
        }
      }
    }
    
    // Remove existing directory if overwriting
    await fs.remove(targetDir);
  }
  
  // Create directory
  await fs.ensureDir(targetDir);
  
  return targetDir;
}

/**
 * Interactive project setup wizard
 */
async function runCreationWizard(projectName?: string): Promise<{
  name: string;
  options: CreateOptions;
}> {
  const questions = [];
  
  // Project name
  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: async (input: string) => {
        if (!input.trim()) {
          return 'Project name is required';
        }
        
        const sanitized = validate.sanitizeProjectName(input);
        const result = await validate.validateProjectName(sanitized);
        return result.isValid || result.errors[0];
      },
      filter: (input: string) => validate.sanitizeProjectName(input),
    });
  }
  
  // Framework selection
  questions.push({
    type: 'list',
    name: 'framework',
    message: 'Select a framework:',
    default: 'react',
    choices: [
      { name: '⚛️  React', value: 'react' },
      { name: '💚 Vue', value: 'vue' },
      { name: '🔺 Next.js', value: 'nextjs' },
      { name: '🧡 Svelte', value: 'svelte' },
      { name: '🅰️  Angular', value: 'angular' },
    ],
  });
  
  // TypeScript
  questions.push({
    type: 'confirm',
    name: 'typescript',
    message: 'Add TypeScript support?',
    default: true,
  });
  
  // Package manager
  questions.push({
    type: 'list',
    name: 'packageManager',
    message: 'Package manager:',
    default: 'npm',
    choices: [
      { name: 'npm', value: 'npm' },
      { name: 'Yarn', value: 'yarn' },
      { name: 'pnpm', value: 'pnpm' },
      { name: 'Bun', value: 'bun' },
    ],
  });
  
  // Git initialization
  questions.push({
    type: 'confirm',
    name: 'git',
    message: 'Initialize git repository?',
    default: true,
  });
  
  // Install dependencies
  questions.push({
    type: 'confirm',
    name: 'install',
    message: 'Install dependencies now?',
    default: true,
  });
  
  ui.header('🚀 Create IssueFlow Project');
  
  const answers = await inquirer.prompt(questions);
  
  return {
    name: projectName || answers.name,
    options: {
      framework: answers.framework,
      packageManager: answers.packageManager,
      typescript: answers.typescript,
      git: answers.git,
      install: answers.install,
    },
  };
}

/**
 * Create basic project files based on framework
 */
async function createBaseProject(
  projectDir: string,
  name: string,
  framework: SupportedFramework,
  typescript: boolean
): Promise<void> {
  // Create basic package.json
  const packageJson = {
    name,
    version: '0.1.0',
    private: true,
    description: `${name} - A project with IssueFlow integration`,
    scripts: {
      dev: 'echo "Development server not configured yet"',
      build: 'echo "Build script not configured yet"',
      start: 'echo "Start script not configured yet"',
    },
    dependencies: {},
    devDependencies: {},
    keywords: ['issueflow', framework],
    author: '',
    license: 'MIT',
  };
  
  // Add framework-specific configurations
  switch (framework) {
    case 'react':
      packageJson.scripts = {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        lint: 'eslint src --ext js,jsx,ts,tsx',
      };
      packageJson.dependencies = {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      };
      packageJson.devDependencies = {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^4.0.0',
      };
      if (typescript) {
        Object.assign(packageJson.devDependencies, {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          typescript: '^5.0.0',
        });
      }
      break;
      
    case 'vue':
      packageJson.scripts = {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      };
      packageJson.dependencies = {
        vue: '^3.3.0',
      };
      packageJson.devDependencies = {
        '@vitejs/plugin-vue': '^4.0.0',
        vite: '^4.0.0',
      };
      if (typescript) {
        Object.assign(packageJson.devDependencies, {
          typescript: '^5.0.0',
          'vue-tsc': '^1.0.0',
        });
      }
      break;
      
    case 'nextjs':
      packageJson.scripts = {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      };
      packageJson.dependencies = {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      };
      if (typescript) {
        Object.assign(packageJson.devDependencies, {
          '@types/node': '^20.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          typescript: '^5.0.0',
        });
      }
      break;
  }
  
  await fs.writeJson(join(projectDir, 'package.json'), packageJson, { spaces: 2 });
  
  // Create basic project structure
  await fs.ensureDir(join(projectDir, 'src'));
  await fs.ensureDir(join(projectDir, 'public'));
  
  // Create README.md
  const readme = `# ${name}

A project with IssueFlow integration.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure IssueFlow:
   - Update \`issueflow.config.js\` with your project settings
   - Set environment variables in \`.env\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## IssueFlow Integration

This project includes IssueFlow for feedback collection and issue tracking.

- 🎯 **Automatic Setup**: Pre-configured for ${framework}
- 🚀 **Quick Integration**: Widget ready to use
- 📊 **Analytics**: Track user feedback and issues
- 🔗 **Integrations**: GitHub, ClickUp, and more

## Documentation

- [IssueFlow Docs](https://docs.issueflow.dev)
- [${framework.charAt(0).toUpperCase() + framework.slice(1)} Integration Guide](https://docs.issueflow.dev/frameworks/${framework})

## Support

Need help? Join our [Discord community](https://discord.gg/issueflow) or create an issue on GitHub.
`;
  
  await fs.writeFile(join(projectDir, 'README.md'), readme);
}

/**
 * Main create command
 */
async function createProject(
  projectName?: string,
  options: CreateOptions = {}
): Promise<void> {
  try {
    let name = projectName;
    let createOptions = options;
    
    // Run interactive wizard if missing required information
    if (!name || !options.framework) {
      const wizardResult = await runCreationWizard(name);
      name = wizardResult.name;
      createOptions = { ...options, ...wizardResult.options };
    }
    
    if (!name) {
      throw new Error('Project name is required');
    }
    
    // Validate project name
    await validateProjectName(name);
    
    ui.separator();
    logger.info(`Creating new ${createOptions.framework} project: ${name}`);
    
    // Create project directory
    const projectDir = await withSpinner(
      'Creating project directory...',
      () => createProjectDirectory(name!, createOptions)
    );
    
    // Create base project structure
    await withSpinner(
      'Setting up project structure...',
      () => createBaseProject(
        projectDir,
        name!,
        createOptions.framework!,
        createOptions.typescript || false
      )
    );
    
    // Initialize IssueFlow using the init command
    const initOptions: InitOptions = {
      name: name!,
      framework: createOptions.framework!,
      packageManager: createOptions.packageManager || 'npm',
      typescript: createOptions.typescript,
      git: createOptions.git,
      install: createOptions.install,
      skipPrompts: true,
    };
    
    const context: CLIContext = {
      cwd: projectDir,
      config: configManager.getConfig(),
      logger,
    };
    
    await initCommand(context, initOptions);
    
    // Success message
    ui.separator();
    ui.success(`🎉 Project "${name}" created successfully!`);
    
    console.log('');
    logger.info('Next steps:');
    ui.list([
      `cd ${name}`,
      createOptions.install ? '' : `${createOptions.packageManager || 'npm'} install`,
      `${createOptions.packageManager || 'npm'} run dev`,
    ].filter(Boolean));
    
    console.log('');
    logger.info('Happy coding! 🚀');
    
  } catch (error) {
    if (error instanceof ValidationError) {
      ui.error(`Validation Error:\n${error.errors.join('\n')}`);
    } else {
      ui.error(`Project creation failed: ${error.message}`);
      logger.debug(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const program = new Command();
  const version = getVersion();
  
  program
    .name('create-issueflow')
    .description('🚀 Create a new project with IssueFlow integration')
    .version(version, '-v, --version')
    .argument('[project-name]', 'Name of the project')
    .option('-f, --framework <framework>', 'Target framework (react, vue, nextjs, svelte, angular)')
    .option('-p, --package-manager <manager>', 'Package manager (npm, yarn, pnpm, bun)')
    .option('--typescript', 'Use TypeScript')
    .option('--no-typescript', 'Do not use TypeScript')
    .option('--git', 'Initialize git repository')
    .option('--no-git', 'Do not initialize git repository')
    .option('--install', 'Install dependencies')
    .option('--no-install', 'Do not install dependencies')
    .option('--force', 'Overwrite existing directory')
    .action(async (projectName, options) => {
      await createProject(projectName, options);
    });
  
  // Show help if no arguments
  if (!process.argv.slice(2).length) {
    ui.header('🚀 Create IssueFlow Project');
    
    console.log('Usage:');
    ui.list([
      'npx create-issueflow my-project',
      'npm create issueflow@latest my-project',
      'yarn create issueflow my-project',
      'pnpm create issueflow my-project',
    ]);
    
    console.log('');
    program.help();
    return;
  }
  
  await program.parseAsync();
}

// Error handling
process.on('uncaughtException', (error) => {
  ui.error(`Uncaught Exception: ${error.message}`);
  logger.debug(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  ui.error(`Unhandled Rejection: ${reason}`);
  logger.debug(reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    ui.error(`CLI Error: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  });
}

export { main, createProject };
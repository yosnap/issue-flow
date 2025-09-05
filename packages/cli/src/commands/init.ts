/**
 * @fileoverview Init Command
 * 
 * Handles project initialization and configuration setup.
 * Provides interactive wizard for framework selection and setup.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import { detectPackageManager } from 'detect-package-manager';
import { execa } from 'execa';
import type { Command } from 'commander';
import type { 
  InitOptions, 
  SupportedFramework, 
  PackageManager,
  CLIContext,
  FrameworkDetection
} from '../types';
import { configManager } from '../utils/config';
import { logger, spinner, ui } from '../utils/spinner';
import { templateManager } from '../utils/templates';
import { validate, ValidationError } from '../utils/validation';

/**
 * Framework detection patterns
 */
const FRAMEWORK_PATTERNS = {
  react: {
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@vitejs/plugin-react', '@types/react', 'vite'],
    files: ['src/App.tsx', 'src/App.jsx', 'src/main.tsx', 'src/main.jsx'],
    configs: ['vite.config.ts', 'vite.config.js', 'webpack.config.js'],
  },
  vue: {
    dependencies: ['vue'],
    devDependencies: ['@vitejs/plugin-vue', '@vue/cli-service', 'vite'],
    files: ['src/App.vue', 'src/main.ts', 'src/main.js'],
    configs: ['vite.config.ts', 'vite.config.js', 'vue.config.js'],
  },
  nextjs: {
    dependencies: ['next', 'react', 'react-dom'],
    devDependencies: ['typescript', '@types/node'],
    files: ['next.config.js', 'next.config.ts', 'pages/_app.tsx', 'app/layout.tsx'],
    configs: ['next.config.js', 'next.config.ts'],
  },
  svelte: {
    dependencies: ['svelte'],
    devDependencies: ['@sveltejs/kit', '@sveltejs/adapter-auto', 'vite'],
    files: ['src/app.html', 'src/routes/+layout.svelte', 'svelte.config.js'],
    configs: ['svelte.config.js', 'vite.config.js'],
  },
  angular: {
    dependencies: ['@angular/core', '@angular/common', '@angular/platform-browser'],
    devDependencies: ['@angular/cli', '@angular/compiler-cli', 'typescript'],
    files: ['angular.json', 'src/app/app.component.ts', 'src/main.ts', 'src/app/app.module.ts'],
    configs: ['angular.json', 'tsconfig.json', 'tsconfig.app.json'],
  },
};

/**
 * Detect current framework based on project files and dependencies
 */
async function detectFramework(projectRoot: string): Promise<FrameworkDetection> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let packageJson: any = {};
  
  if (await fs.pathExists(packageJsonPath)) {
    packageJson = await fs.readJson(packageJsonPath);
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const results: Array<{
    framework: SupportedFramework;
    confidence: number;
    evidence: { dependencies: string[]; configFiles: string[]; structure: string[] };
  }> = [];

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    const evidence = {
      dependencies: [] as string[],
      configFiles: [] as string[],
      structure: [] as string[],
    };

    let confidence = 0;

    // Check dependencies
    for (const dep of [...patterns.dependencies, ...patterns.devDependencies]) {
      if (allDeps[dep]) {
        evidence.dependencies.push(dep);
        confidence += framework === 'nextjs' && dep === 'next' ? 0.5 : 0.3;
      }
    }

    // Check config files
    for (const configFile of patterns.configs) {
      const configPath = path.join(projectRoot, configFile);
      if (await fs.pathExists(configPath)) {
        evidence.configFiles.push(configFile);
        confidence += 0.3;
      }
    }

    // Check file structure
    for (const file of patterns.files) {
      const filePath = path.join(projectRoot, file);
      if (await fs.pathExists(filePath)) {
        evidence.structure.push(file);
        confidence += 0.2;
      }
    }

    if (confidence > 0) {
      results.push({
        framework: framework as SupportedFramework,
        confidence: Math.min(confidence, 1),
        evidence,
      });
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return results.length > 0
    ? {
        framework: results[0].framework,
        confidence: results[0].confidence,
        evidence: results[0].evidence,
      }
    : {
        framework: null,
        confidence: 0,
        evidence: { dependencies: [], configFiles: [], structure: [] },
      };
}

/**
 * Interactive project configuration wizard
 */
async function runConfigurationWizard(
  projectRoot: string,
  options: Partial<InitOptions>
): Promise<InitOptions> {
  const detection = await detectFramework(projectRoot);
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let detectedPackageManager: PackageManager = 'npm';

  try {
    detectedPackageManager = (await detectPackageManager({ cwd: projectRoot })) as PackageManager;
  } catch {
    // Fallback to npm
  }

  const projectName = options.name || path.basename(projectRoot);

  ui.header('🚀 IssueFlow Setup Wizard');

  if (detection.framework) {
    ui.success(`Detected framework: ${detection.framework} (confidence: ${Math.round(detection.confidence * 100)}%)`);
    
    if (detection.evidence.dependencies.length > 0) {
      ui.list(detection.evidence.dependencies, '📦');
    }
    
    if (detection.evidence.configFiles.length > 0) {
      ui.list(detection.evidence.configFiles, '⚙️');
    }
  }

  const questions = [];

  // Project name
  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName,
      validate: async (input: string) => {
        const result = await validate.validateProjectName(input);
        return result.isValid || result.errors[0];
      },
    });
  }

  // Framework selection
  if (!options.framework) {
    questions.push({
      type: 'list',
      name: 'framework',
      message: 'Select framework:',
      default: detection.framework || 'react',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Vue', value: 'vue' },
        { name: 'Next.js', value: 'nextjs' },
        { name: 'Svelte', value: 'svelte' },
        { name: 'Angular', value: 'angular' },
      ],
    });
  }

  // Package manager
  if (!options.packageManager) {
    questions.push({
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      default: detectedPackageManager,
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'Yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'Bun', value: 'bun' },
      ],
    });
  }

  // TypeScript
  if (options.typescript === undefined) {
    questions.push({
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: true,
    });
  }

  // Install dependencies
  if (options.install === undefined) {
    questions.push({
      type: 'confirm',
      name: 'install',
      message: 'Install dependencies?',
      default: true,
    });
  }

  // Git initialization
  if (options.git === undefined && !await fs.pathExists(path.join(projectRoot, '.git'))) {
    questions.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      default: true,
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    name: options.name || answers.name || projectName,
    framework: options.framework || answers.framework,
    packageManager: options.packageManager || answers.packageManager,
    typescript: options.typescript ?? answers.typescript ?? true,
    install: options.install ?? answers.install ?? true,
    git: options.git ?? answers.git ?? false,
    skipPrompts: options.skipPrompts ?? false,
  };
}

/**
 * Install project dependencies
 */
async function installDependencies(
  projectRoot: string,
  packageManager: PackageManager,
  dependencies: string[]
): Promise<void> {
  if (dependencies.length === 0) return;

  const commands = {
    npm: ['install', ...dependencies],
    yarn: ['add', ...dependencies],
    pnpm: ['add', ...dependencies],
    bun: ['add', ...dependencies],
  };

  const command = commands[packageManager];
  
  spinner.start(`Installing dependencies with ${packageManager}...`);
  
  try {
    await execa(packageManager, command, { cwd: projectRoot });
    spinner.succeed(`Dependencies installed with ${packageManager}`);
  } catch (error) {
    spinner.fail(`Failed to install dependencies`);
    throw error;
  }
}

/**
 * Initialize git repository
 */
async function initializeGit(projectRoot: string): Promise<void> {
  spinner.start('Initializing git repository...');
  
  try {
    await execa('git', ['init'], { cwd: projectRoot });
    
    // Create basic .gitignore if it doesn't exist
    const gitignorePath = path.join(projectRoot, '.gitignore');
    if (!await fs.pathExists(gitignorePath)) {
      const gitignoreContent = `
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# IssueFlow
.issueflow/
      `.trim();
      
      await fs.writeFile(gitignorePath, gitignoreContent);
    }
    
    spinner.succeed('Git repository initialized');
  } catch (error) {
    spinner.fail('Failed to initialize git repository');
    logger.warn('Git initialization failed, continuing without git...');
  }
}

/**
 * Main init command handler
 */
export async function initCommand(
  context: CLIContext,
  options: Partial<InitOptions> = {}
): Promise<void> {
  try {
    const projectRoot = context.cwd;
    
    // Check if already initialized
    if (configManager.hasProject()) {
      const existing = configManager.getProject();
      if (existing) {
        ui.warning(`IssueFlow is already initialized for "${existing.name}" (${existing.framework})`);
        
        const { reinitialize } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'reinitialize',
            message: 'Do you want to reinitialize?',
            default: false,
          },
        ]);
        
        if (!reinitialize) {
          logger.info('Initialization cancelled');
          return;
        }
        
        configManager.resetProject();
      }
    }

    // Run configuration wizard (unless skipping prompts)
    const config = options.skipPrompts
      ? options as InitOptions
      : await runConfigurationWizard(projectRoot, options);

    // Validate configuration
    const validationResult = await validate.validateProjectConfig({
      name: config.name,
      framework: config.framework,
      packageManager: config.packageManager,
    });

    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    ui.separator();
    logger.info(`Setting up IssueFlow for ${config.framework} project: ${config.name}`);

    // Initialize project configuration
    const projectConfig = {
      id: `${config.name}-${Date.now()}`,
      name: config.name,
      framework: config.framework,
      packageManager: config.packageManager,
      issueflow: {
        projectId: `${config.name}-${Date.now()}`,
        apiUrl: 'https://api.issueflow.dev',
        widget: {
          position: 'bottom-right' as const,
          trigger: 'button' as const,
          triggerText: 'Feedback',
        },
        theme: {
          mode: 'auto' as const,
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
      build: {
        outDir: 'dist',
        publicDir: 'public',
        env: {},
      },
      integrations: {},
    };

    configManager.initProject(projectRoot, projectConfig);

    // Generate template files
    const template = templateManager.getFrameworkTemplate(config.framework);
    const templateContext = templateManager.createContext(
      config.name,
      config.framework,
      config.packageManager,
      {
        typescript: config.typescript,
      }
    );

    spinner.start('Generating project files...');
    
    try {
      await templateManager.generateFrameworkFiles(
        config.framework,
        templateContext,
        projectRoot
      );
      spinner.succeed('Project files generated');
    } catch (error) {
      spinner.fail('Failed to generate project files');
      throw error;
    }

    // Install dependencies
    if (config.install) {
      await installDependencies(
        projectRoot,
        config.packageManager,
        template.dependencies
      );
    }

    // Initialize git
    if (config.git) {
      await initializeGit(projectRoot);
    }

    // Success message
    ui.separator();
    ui.success(`🎉 IssueFlow initialized successfully!`);
    
    console.log('');
    ui.keyValue('Project Name', config.name);
    ui.keyValue('Framework', config.framework);
    ui.keyValue('Package Manager', config.packageManager);
    ui.keyValue('TypeScript', config.typescript ? 'Yes' : 'No');
    
    console.log('');
    logger.info('Next steps:');
    ui.list([
      `Configure your project ID in issueflow.config.js`,
      `Add environment variables to .env`,
      `Run "${config.packageManager} run dev" to start development`,
      `Check the documentation at https://docs.issueflow.dev`,
    ]);

    // Run post-install commands
    if (template.postInstall) {
      for (const command of template.postInstall) {
        console.log(command);
      }
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      ui.error(`Validation Error:\n${error.errors.join('\n')}`);
    } else {
      ui.error(`Initialization failed: ${error.message}`);
      logger.debug(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Register init command with Commander
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize IssueFlow in your project')
    .option('-n, --name <name>', 'Project name')
    .option('-f, --framework <framework>', 'Target framework (react, vue, nextjs, svelte, angular)')
    .option('-p, --package-manager <manager>', 'Package manager (npm, yarn, pnpm, bun)')
    .option('--typescript', 'Use TypeScript', true)
    .option('--no-typescript', 'Do not use TypeScript')
    .option('--install', 'Install dependencies', true)
    .option('--no-install', 'Do not install dependencies')
    .option('--git', 'Initialize git repository')
    .option('--no-git', 'Do not initialize git repository')
    .option('--skip-prompts', 'Skip interactive prompts')
    .action(async (options) => {
      const context: CLIContext = {
        cwd: process.cwd(),
        config: configManager.getConfig(),
        logger,
      };
      
      await initCommand(context, options);
    });
}
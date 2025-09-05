/**
 * @fileoverview Dev Command
 * 
 * Provides development server functionality with hot-reload,
 * API proxy, and live preview capabilities.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { execa } from 'execa';
import type { Command } from 'commander';
import type { DevOptions, CLIContext } from '../types';
import { configManager } from '../utils/config';
import { logger, spinner, ui, withSpinner } from '../utils/spinner';
import { validate } from '../utils/validation';

/**
 * Development server configuration
 */
interface DevServerConfig {
  port: number;
  host: string;
  https: boolean;
  proxy: {
    apiUrl: string;
    target: string;
  };
  watch: {
    enabled: boolean;
    paths: string[];
  };
  livereload: boolean;
}

/**
 * Framework-specific dev command patterns
 */
const DEV_COMMANDS = {
  react: {
    vite: 'vite',
    webpack: 'react-scripts start',
    custom: 'npm run dev',
  },
  vue: {
    vite: 'vite',
    cli: 'vue-cli-service serve',
    custom: 'npm run dev',
  },
  nextjs: {
    default: 'next dev',
    custom: 'npm run dev',
  },
  svelte: {
    kit: 'svelte-kit dev',
    vite: 'vite dev',
    custom: 'npm run dev',
  },
  angular: {
    cli: 'ng serve',
    custom: 'npm run dev',
  },
};

/**
 * Detect development command based on project configuration
 */
async function detectDevCommand(projectRoot: string, framework: string): Promise<string[]> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    throw new Error('package.json not found in project root');
  }

  const packageJson = await fs.readJson(packageJsonPath);
  const scripts = packageJson.scripts || {};
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Check for custom dev script first
  if (scripts.dev) {
    return ['npm', 'run', 'dev'];
  }

  // Framework-specific detection
  switch (framework) {
    case 'react':
      if (dependencies.vite) return ['vite'];
      if (dependencies['react-scripts']) return ['react-scripts', 'start'];
      if (scripts.start) return ['npm', 'start'];
      break;

    case 'vue':
      if (dependencies.vite) return ['vite'];
      if (dependencies['@vue/cli-service']) return ['vue-cli-service', 'serve'];
      if (scripts.serve) return ['npm', 'run', 'serve'];
      break;

    case 'nextjs':
      if (dependencies.next) return ['next', 'dev'];
      break;

    case 'svelte':
      if (dependencies['@sveltejs/kit']) return ['svelte-kit', 'dev'];
      if (dependencies.vite) return ['vite', 'dev'];
      break;

    case 'angular':
      if (dependencies['@angular/cli']) return ['ng', 'serve'];
      break;
  }

  // Fallback to npm run dev
  return ['npm', 'run', 'dev'];
}

/**
 * Create development server configuration
 */
function createDevServerConfig(options: DevOptions): DevServerConfig {
  const project = configManager.getProject();
  
  if (!project) {
    throw new Error('No project configuration found. Run "issueflow init" first.');
  }

  return {
    port: options.port || 3000,
    host: options.host || 'localhost',
    https: options.https || false,
    proxy: {
      apiUrl: project.issueflow.apiUrl || 'https://api.issueflow.dev',
      target: project.issueflow.apiUrl || 'https://api.issueflow.dev',
    },
    watch: {
      enabled: options.watch !== false,
      paths: [
        'issueflow.config.js',
        'issueflow.config.ts',
        '.env',
        '.env.local',
      ],
    },
    livereload: true,
  };
}

/**
 * Start development server with proxy and watching
 */
async function startDevServer(
  projectRoot: string,
  framework: string,
  options: DevOptions
): Promise<void> {
  const config = createDevServerConfig(options);
  
  logger.info('🚀 Starting development server...');
  
  // Display configuration
  ui.separator();
  ui.keyValue('Framework', framework);
  ui.keyValue('Host', `${config.https ? 'https' : 'http'}://${config.host}:${config.port}`);
  ui.keyValue('API Proxy', config.proxy.target);
  ui.keyValue('Watch Mode', config.watch.enabled ? 'Enabled' : 'Disabled');
  ui.separator();

  try {
    // Detect and prepare dev command
    const devCommand = await detectDevCommand(projectRoot, framework);
    logger.debug(`Using dev command: ${devCommand.join(' ')}`);

    // Set environment variables
    const env = {
      ...process.env,
      PORT: config.port.toString(),
      HOST: config.host,
      HTTPS: config.https.toString(),
      ISSUEFLOW_API_URL: config.proxy.apiUrl,
      NODE_ENV: 'development',
    };

    // Check port availability
    const isPortAvailable = await validate.isPortAvailable(config.port);
    if (!isPortAvailable) {
      ui.warning(`Port ${config.port} is already in use`);
      
      // Try to find next available port
      let nextPort = config.port + 1;
      while (!await validate.isPortAvailable(nextPort) && nextPort < config.port + 10) {
        nextPort++;
      }
      
      if (nextPort < config.port + 10) {
        config.port = nextPort;
        env.PORT = nextPort.toString();
        logger.info(`Using port ${nextPort} instead`);
      } else {
        throw new Error(`No available ports found near ${config.port}`);
      }
    }

    // Start the development server
    logger.info('Starting development server...');
    
    const [command, ...args] = devCommand;
    const devProcess = execa(command, args, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });

    // Handle process signals
    process.on('SIGINT', () => {
      logger.info('\nShutting down development server...');
      devProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      logger.info('\nShutting down development server...');
      devProcess.kill('SIGTERM');
    });

    // Wait for process to complete
    await devProcess;

  } catch (error) {
    if (error.exitCode === 130 || error.signal === 'SIGINT') {
      // User interrupted with Ctrl+C
      logger.info('\nDevelopment server stopped');
      return;
    }
    
    throw error;
  }
}

/**
 * Watch configuration files for changes
 */
async function startConfigWatcher(projectRoot: string): Promise<void> {
  const chokidar = await import('chokidar');
  const configPaths = [
    'issueflow.config.js',
    'issueflow.config.ts',
    '.env',
    '.env.local',
  ].map(p => path.join(projectRoot, p));

  logger.debug('Starting configuration file watcher...');

  const watcher = chokidar.watch(configPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles except .env
    persistent: true,
  });

  watcher.on('change', (filepath) => {
    const relativePath = path.relative(projectRoot, filepath);
    logger.info(`📝 Configuration file changed: ${relativePath}`);
    ui.warning('Restart the development server to apply changes');
  });

  // Clean up watcher on exit
  process.on('SIGINT', () => {
    watcher.close();
  });

  process.on('SIGTERM', () => {
    watcher.close();
  });
}

/**
 * Open browser automatically
 */
async function openBrowser(url: string): Promise<void> {
  try {
    const open = await import('open');
    await open.default(url);
    logger.info(`🌐 Browser opened to ${url}`);
  } catch (error) {
    logger.debug(`Failed to open browser: ${error.message}`);
  }
}

/**
 * Main dev command handler
 */
export async function devCommand(
  context: CLIContext,
  options: DevOptions = {}
): Promise<void> {
  try {
    const projectRoot = context.cwd;
    const project = configManager.getProject();
    
    if (!project) {
      ui.error('No IssueFlow project found in current directory');
      logger.info('Run "issueflow init" to initialize a project');
      process.exit(1);
    }

    logger.info(`Starting development server for ${project.name} (${project.framework})`);

    // Validate project files
    await withSpinner(
      'Validating project configuration...',
      async () => {
        const configPath = path.join(projectRoot, 'issueflow.config.js');
        const configTsPath = path.join(projectRoot, 'issueflow.config.ts');
        
        if (!await fs.pathExists(configPath) && !await fs.pathExists(configTsPath)) {
          throw new Error('IssueFlow configuration file not found. Run "issueflow init" to create it.');
        }

        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (!await fs.pathExists(packageJsonPath)) {
          throw new Error('package.json not found in project root');
        }
      }
    );

    // Start config watcher if watch mode is enabled
    if (options.watch !== false) {
      await startConfigWatcher(projectRoot);
    }

    // Start development server
    await startDevServer(projectRoot, project.framework, options);

    // Open browser if requested
    if (options.open) {
      const protocol = options.https ? 'https' : 'http';
      const host = options.host || 'localhost';
      const port = options.port || 3000;
      const url = `${protocol}://${host}:${port}`;
      
      // Delay to let server start
      setTimeout(() => {
        openBrowser(url);
      }, 2000);
    }

  } catch (error) {
    ui.error(`Development server failed: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  }
}

/**
 * Register dev command with Commander
 */
export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Start development server')
    .option('-p, --port <port>', 'Port number', parseInt)
    .option('-h, --host <host>', 'Host address', 'localhost')
    .option('--https', 'Enable HTTPS')
    .option('--open', 'Open browser automatically')
    .option('--no-watch', 'Disable file watching')
    .action(async (options) => {
      const context: CLIContext = {
        cwd: process.cwd(),
        config: configManager.getConfig(),
        logger,
      };
      
      await devCommand(context, options);
    });
}
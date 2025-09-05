#!/usr/bin/env node

/**
 * @fileoverview IssueFlow CLI Entry Point
 * 
 * Main CLI binary that registers all commands and handles
 * global error handling and argument parsing.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger, ui } from '../utils/spinner';
import { configManager } from '../utils/config';
import { registerInitCommand } from '../commands/init';
import { registerDevCommand } from '../commands/dev';
import { registerConfigCommand } from '../commands/config';

/**
 * Get package version from package.json
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
 * Setup global error handling
 */
function setupErrorHandling(): void {
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

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n');
    logger.info('Goodbye! 👋');
    process.exit(0);
  });
}

/**
 * Check for updates (non-blocking)
 */
async function checkForUpdates(): Promise<void> {
  try {
    const global = configManager.getGlobal();
    
    if (!global.updateCheck.enabled) {
      return;
    }
    
    const now = new Date().toISOString();
    const lastCheck = global.updateCheck.lastCheck;
    
    // Check at most once per day
    if (lastCheck) {
      const lastCheckDate = new Date(lastCheck);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (lastCheckDate > oneDayAgo) {
        return;
      }
    }
    
    // Update last check time
    configManager.setGlobal({
      updateCheck: {
        enabled: true,
        lastCheck: now,
      },
    });
    
    // TODO: Implement actual update check against npm registry
    logger.debug('Update check completed');
    
  } catch (error) {
    // Fail silently for update checks
    logger.debug(`Update check failed: ${error.message}`);
  }
}

/**
 * Display help for command when no subcommand is provided
 */
function displayContextualHelp(program: Command, commandName?: string): void {
  if (!commandName) {
    program.help();
    return;
  }
  
  const command = program.commands.find(cmd => cmd.name() === commandName);
  if (command) {
    command.help();
  } else {
    ui.error(`Unknown command: ${commandName}`);
    program.help();
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  setupErrorHandling();
  
  const program = new Command();
  const version = getVersion();
  
  // Configure main command
  program
    .name('issueflow')
    .description('🚀 IssueFlow CLI - Setup and manage feedback collection in your projects')
    .version(version, '-v, --version', 'Show version number')
    .option('-d, --debug', 'Enable debug logging')
    .option('--no-update-check', 'Disable update checking')
    .hook('preAction', (thisCommand) => {
      // Enable debug logging if requested
      if (thisCommand.opts().debug) {
        process.env.DEBUG = '1';
        logger.info('Debug mode enabled');
      }
    });

  // Register all commands
  registerInitCommand(program);
  registerDevCommand(program);
  registerConfigCommand(program);

  // Add additional commands placeholders for future implementation
  program
    .command('build')
    .description('Build project for production')
    .action(() => {
      ui.warning('Build command coming soon!');
      logger.info('This feature is planned for a future release');
    });

  program
    .command('deploy')
    .description('Deploy project to hosting platform')
    .action(() => {
      ui.warning('Deploy command coming soon!');
      logger.info('This feature is planned for a future release');
    });

  program
    .command('plugins')
    .description('Manage framework adapters and plugins')
    .action(() => {
      ui.warning('Plugin management coming soon!');
      logger.info('This feature is planned for a future release');
    });

  // Custom help command
  program
    .command('help [command]')
    .description('Display help for command')
    .action((commandName) => {
      displayContextualHelp(program, commandName);
    });

  // Handle unknown commands
  program.on('command:*', (operands) => {
    ui.error(`Unknown command: ${operands[0]}`);
    logger.info('Run "issueflow --help" to see available commands');
    process.exit(1);
  });

  // Show help if no arguments provided
  if (!process.argv.slice(2).length) {
    ui.header('🚀 Welcome to IssueFlow CLI');
    
    console.log('Quick start:');
    ui.list([
      'issueflow init        # Initialize IssueFlow in your project',
      'issueflow dev         # Start development server',
      'issueflow config      # Manage configuration',
      'issueflow --help      # Show all available commands',
    ]);
    
    console.log('');
    logger.info('For more information, visit: https://docs.issueflow.dev');
    
    // Check for updates in background
    checkForUpdates();
    
    return;
  }

  // Parse command line arguments
  try {
    await program.parseAsync(process.argv);
    
    // Check for updates after successful command execution
    checkForUpdates();
    
  } catch (error) {
    if (error.code === 'commander.helpDisplayed') {
      // Help was displayed, exit normally
      return;
    }
    
    if (error.code === 'commander.version') {
      // Version was displayed, exit normally
      return;
    }
    
    // Handle other command errors
    ui.error(`Command failed: ${error.message}`);
    
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    ui.error(`CLI Error: ${error.message}`);
    logger.debug(error.stack);
    process.exit(1);
  });
}

export { main };
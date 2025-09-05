/**
 * @fileoverview CLI UI Utilities
 * 
 * Provides spinner, logging, and other UI utilities
 * for a consistent CLI experience.
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * Log levels for filtering output
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Logger configuration
 */
interface LoggerOptions {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

/**
 * Enhanced logger with colors and formatting
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;

  constructor(options: LoggerOptions = { level: LogLevel.INFO }) {
    this.level = options.level;
    this.prefix = options.prefix || '';
    this.timestamp = options.timestamp || false;
  }

  /**
   * Format message with prefix and timestamp
   */
  private formatMessage(message: string, level?: string): string {
    let formatted = message;
    
    if (this.timestamp) {
      const time = new Date().toLocaleTimeString();
      formatted = `[${time}] ${formatted}`;
    }
    
    if (this.prefix) {
      formatted = `${this.prefix} ${formatted}`;
    }
    
    if (level) {
      formatted = `${level} ${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Log debug message
   */
  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(this.formatMessage(message, '[DEBUG]')));
    }
  }

  /**
   * Log info message
   */
  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(this.formatMessage(message, '[INFO]')));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(chalk.yellow(this.formatMessage(message, '[WARN]')));
    }
  }

  /**
   * Log error message
   */
  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(this.formatMessage(message, '[ERROR]')));
    }
  }

  /**
   * Log success message
   */
  success(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.green(this.formatMessage(message, '[SUCCESS]')));
    }
  }

  /**
   * Log plain message without formatting
   */
  log(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage(message));
    }
  }

  /**
   * Create a new logger with different options
   */
  child(options: Partial<LoggerOptions>): Logger {
    return new Logger({
      level: options.level ?? this.level,
      prefix: options.prefix ?? this.prefix,
      timestamp: options.timestamp ?? this.timestamp,
    });
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

/**
 * Spinner manager for long-running operations
 */
export class SpinnerManager {
  private spinner: Ora | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start spinner with message
   */
  start(message: string): void {
    if (this.spinner) {
      this.stop();
    }
    
    this.spinner = ora({
      text: message,
      color: 'blue',
      spinner: 'dots',
    }).start();
  }

  /**
   * Update spinner message
   */
  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop spinner with success message
   */
  succeed(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure message
   */
  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with warning message
   */
  warn(message?: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with info message
   */
  info(message?: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner without message
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is active
   */
  isActive(): boolean {
    return this.spinner !== null;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
});

/**
 * Default spinner manager
 */
export const spinner = new SpinnerManager(logger);

/**
 * Utility functions for common UI patterns
 */
export const ui = {
  /**
   * Print a header with decorative border
   */
  header(title: string): void {
    const border = '='.repeat(title.length + 4);
    console.log(chalk.cyan(border));
    console.log(chalk.cyan(`  ${title}  `));
    console.log(chalk.cyan(border));
    console.log('');
  },

  /**
   * Print a section separator
   */
  separator(): void {
    console.log(chalk.gray('-'.repeat(50)));
  },

  /**
   * Print key-value pairs in a formatted way
   */
  keyValue(key: string, value: string): void {
    console.log(`${chalk.blue(key.padEnd(20))} ${chalk.white(value)}`);
  },

  /**
   * Print a list of items
   */
  list(items: string[], bullet: string = '•'): void {
    items.forEach(item => {
      console.log(`  ${chalk.blue(bullet)} ${item}`);
    });
  },

  /**
   * Print a warning box
   */
  warning(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const border = '┌' + '─'.repeat(maxLength + 2) + '┐';
    const bottomBorder = '└' + '─'.repeat(maxLength + 2) + '┘';
    
    console.log(chalk.yellow(border));
    lines.forEach(line => {
      console.log(chalk.yellow(`│ ${line.padEnd(maxLength)} │`));
    });
    console.log(chalk.yellow(bottomBorder));
  },

  /**
   * Print an error box
   */
  error(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const border = '┌' + '─'.repeat(maxLength + 2) + '┐';
    const bottomBorder = '└' + '─'.repeat(maxLength + 2) + '┘';
    
    console.log(chalk.red(border));
    lines.forEach(line => {
      console.log(chalk.red(`│ ${line.padEnd(maxLength)} │`));
    });
    console.log(chalk.red(bottomBorder));
  },

  /**
   * Print a success box
   */
  success(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const border = '┌' + '─'.repeat(maxLength + 2) + '┐';
    const bottomBorder = '└' + '─'.repeat(maxLength + 2) + '┘';
    
    console.log(chalk.green(border));
    lines.forEach(line => {
      console.log(chalk.green(`│ ${line.padEnd(maxLength)} │`));
    });
    console.log(chalk.green(bottomBorder));
  },

  /**
   * Create a progress indicator
   */
  progress(current: number, total: number, message: string = ''): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    process.stdout.write(`\r${chalk.blue(bar)} ${percentage}% ${message}`);
    
    if (current === total) {
      console.log(''); // New line when complete
    }
  },

  /**
   * Clear the current line (useful for progress updates)
   */
  clearLine(): void {
    process.stdout.write('\r\x1b[K');
  },
};

/**
 * Execute a function with spinner
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<T> {
  spinner.start(message);
  
  try {
    const result = await fn();
    spinner.succeed(successMessage || 'Complete');
    return result;
  } catch (error) {
    spinner.fail(errorMessage || 'Failed');
    throw error;
  }
}
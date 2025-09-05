/**
 * @fileoverview Logger Utility
 * 
 * Centralized logging system for the IssueFlow framework.
 * Built on top of Pino for high-performance structured logging.
 */

import pino, { Logger as PinoLogger } from 'pino';

interface LoggerConfig {
  level: string;
  pretty: boolean;
}

export class Logger {
  public pino: PinoLogger;
  private context?: string;

  constructor(config: LoggerConfig, context?: string) {
    this.context = context;
    
    const options: pino.LoggerOptions = {
      level: config.level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME,
        context: this.context,
      },
    };

    if (config.pretty && process.env.NODE_ENV !== 'production') {
      this.pino = pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      this.pino = pino(options);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    const childLogger = Object.create(this);
    childLogger.pino = this.pino.child({ context });
    childLogger.context = context;
    return childLogger;
  }

  /**
   * Log levels
   */
  trace(message: string, ...args: any[]): void {
    this.pino.trace({ context: this.context }, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.pino.debug({ context: this.context }, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.pino.info({ context: this.context }, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.pino.warn({ context: this.context }, message, ...args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (error instanceof Error) {
      this.pino.error({ 
        context: this.context,
        err: {
          message: error.message,
          stack: error.stack,
          ...error
        }
      }, message, ...args);
    } else {
      this.pino.error({ context: this.context, error }, message, ...args);
    }
  }

  fatal(message: string, error?: any, ...args: any[]): void {
    if (error instanceof Error) {
      this.pino.fatal({ 
        context: this.context,
        err: {
          message: error.message,
          stack: error.stack,
          ...error
        }
      }, message, ...args);
    } else {
      this.pino.fatal({ context: this.context, error }, message, ...args);
    }
  }
}
/**
 * @fileoverview Server-side utilities for Next.js API routes
 * 
 * Provides handlers and middleware for Next.js API routes
 * to handle IssueFlow operations on the server side.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { IssueFlowClient } from '@issueflow/sdk';
import type {
  IssueFlowConfig,
  IssueFlowApiRequest,
  IssueFlowApiResponse,
  ApiResponse,
  IssueFlowMiddlewareConfig,
  Issue,
} from '../types';

/**
 * Create API handler for IssueFlow operations
 */
export function createIssueFlowHandler(config: IssueFlowConfig) {
  const client = new IssueFlowClient(config);

  return async (req: IssueFlowApiRequest, res: IssueFlowApiResponse) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      const { method, url } = req;
      const pathname = url?.split('?')[0] || '';

      switch (method) {
        case 'POST':
          if (pathname.endsWith('/issues')) {
            return await handleCreateIssue(req, res, client);
          }
          if (pathname.endsWith('/initialize')) {
            return await handleInitialize(req, res, client);
          }
          break;

        case 'GET':
          if (pathname.endsWith('/issues')) {
            return await handleListIssues(req, res, client);
          }
          if (pathname.endsWith('/user')) {
            return await handleGetUser(req, res, client);
          }
          if (pathname.endsWith('/config')) {
            return await handleGetConfig(req, res, client);
          }
          break;

        case 'PUT':
          if (pathname.includes('/issues/')) {
            return await handleUpdateIssue(req, res, client);
          }
          if (pathname.endsWith('/config')) {
            return await handleUpdateConfig(req, res, client);
          }
          break;

        case 'DELETE':
          if (pathname.includes('/issues/')) {
            return await handleDeleteIssue(req, res, client);
          }
          break;

        default:
          return res.status(405).json({
            success: false,
            error: 'Method not allowed',
          });
      }

      // Route not found
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });

    } catch (error) {
      console.error('[IssueFlow API] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };
}

/**
 * Handle issue creation
 */
async function handleCreateIssue(
  req: IssueFlowApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { issue } = req.body;

  if (!issue) {
    res.status(400).json({
      success: false,
      error: 'Issue data is required',
    });
    return;
  }

  try {
    const result = await client.issues.create(issue);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create issue',
    });
  }
}

/**
 * Handle issues listing
 */
async function handleListIssues(
  req: NextApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { query } = req;
  const filters = {
    page: parseInt(query.page as string) || 1,
    limit: parseInt(query.limit as string) || 10,
    type: query.type as string,
    priority: query.priority as string,
    status: query.status as string,
    search: query.search as string,
  };

  try {
    const issues = await client.issues.list(filters);
    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load issues',
    });
  }
}

/**
 * Handle issue update
 */
async function handleUpdateIssue(
  req: IssueFlowApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { url } = req;
  const issueId = url?.split('/').pop();
  const { issue } = req.body;

  if (!issueId || !issue) {
    res.status(400).json({
      success: false,
      error: 'Issue ID and data are required',
    });
    return;
  }

  try {
    const result = await client.issues.update(issueId, issue);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update issue',
    });
  }
}

/**
 * Handle issue deletion
 */
async function handleDeleteIssue(
  req: NextApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { url } = req;
  const issueId = url?.split('/').pop();

  if (!issueId) {
    res.status(400).json({
      success: false,
      error: 'Issue ID is required',
    });
    return;
  }

  try {
    await client.issues.delete(issueId);
    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete issue',
    });
  }
}

/**
 * Handle initialization
 */
async function handleInitialize(
  req: IssueFlowApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { config } = req.body;

  try {
    if (config) {
      client.updateConfig(config);
    }
    await client.initialize();

    res.status(200).json({
      success: true,
      message: 'IssueFlow initialized successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize',
    });
  }
}

/**
 * Handle user data retrieval
 */
async function handleGetUser(
  req: NextApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  try {
    const user = await client.auth.getCurrentUser();
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    });
  }
}

/**
 * Handle configuration retrieval
 */
async function handleGetConfig(
  req: NextApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  try {
    const config = client.getConfig();
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get config',
    });
  }
}

/**
 * Handle configuration update
 */
async function handleUpdateConfig(
  req: IssueFlowApiRequest,
  res: IssueFlowApiResponse,
  client: IssueFlowClient
): Promise<void> {
  const { config } = req.body;

  if (!config) {
    res.status(400).json({
      success: false,
      error: 'Configuration data is required',
    });
    return;
  }

  try {
    client.updateConfig(config);
    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config',
    });
  }
}

/**
 * Create middleware for rate limiting and CORS
 */
export function createIssueFlowMiddleware(config: IssueFlowMiddlewareConfig) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const clientIP = req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.socket.remoteAddress || 
                    'unknown';

    // Rate limiting
    if (config.rateLimit) {
      const now = Date.now();
      const windowStart = now - config.rateLimit.windowMs;
      
      // Clean old entries
      for (const [ip, data] of requestCounts.entries()) {
        if (data.resetTime < windowStart) {
          requestCounts.delete(ip);
        }
      }

      // Check current IP
      const currentData = requestCounts.get(clientIP);
      if (currentData) {
        if (currentData.count >= config.rateLimit.max) {
          res.status(429).json({
            success: false,
            error: 'Too many requests',
          });
          return;
        }
        currentData.count++;
      } else {
        requestCounts.set(clientIP, {
          count: 1,
          resetTime: now,
        });
      }
    }

    // CORS
    if (config.cors) {
      if (typeof config.cors.origin === 'string') {
        res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
      } else if (Array.isArray(config.cors.origin)) {
        const origin = req.headers.origin;
        if (origin && config.cors.origin.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      } else if (config.cors.origin === true) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.setHeader('Access-Control-Allow-Methods', config.cors.methods.join(', '));
      
      if (config.cors.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }

    // Authentication
    if (config.auth?.required) {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!authHeader && !apiKey) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (config.auth.apiKey && apiKey !== config.auth.apiKey) {
        res.status(401).json({
          success: false,
          error: 'Invalid API key',
        });
        return;
      }
    }

    next();
  };
}

/**
 * Helper to create a complete API route
 */
export function createCompleteApiRoute(config: IssueFlowConfig, middlewareConfig?: IssueFlowMiddlewareConfig) {
  const handler = createIssueFlowHandler(config);
  const middleware = middlewareConfig ? createIssueFlowMiddleware(middlewareConfig) : null;

  return (req: NextApiRequest, res: NextApiResponse) => {
    if (middleware) {
      middleware(req, res, () => handler(req as IssueFlowApiRequest, res as IssueFlowApiResponse));
    } else {
      handler(req as IssueFlowApiRequest, res as IssueFlowApiResponse);
    }
  };
}

/**
 * Default export for convenience
 */
export { createIssueFlowHandler as default };
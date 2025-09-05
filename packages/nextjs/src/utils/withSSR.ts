/**
 * @fileoverview Server-Side Rendering Utilities for Next.js
 * 
 * Utilities for handling IssueFlow in Next.js SSR/SSG contexts,
 * including data fetching and hydration helpers.
 */

import type { GetServerSideProps, GetStaticProps } from 'next';
import { IssueFlowClient } from '@issueflow/sdk';
import type {
  IssueFlowConfig,
  IssueFlowSSRProps,
  Issue,
  User,
  IssueFlowNextJSError,
} from '../types';

/**
 * Create server-side IssueFlow client
 */
function createServerClient(config: IssueFlowConfig): IssueFlowClient {
  return new IssueFlowClient({
    ...config,
    // Ensure server-side specific settings
    ssr: true,
  });
}

/**
 * Higher-order function for Next.js getServerSideProps with IssueFlow
 */
export function withIssueFlowSSR<P = {}>(
  config: IssueFlowConfig,
  getServerSidePropsFunc?: GetServerSideProps<P>
): GetServerSideProps<P & IssueFlowSSRProps> {
  return async (context) => {
    const ssrProps: IssueFlowSSRProps['ssr'] = {
      isLoading: false,
      error: null,
    };

    let initialIssues: Issue[] = [];
    let initialUser: User | null = null;

    try {
      // Create server-side client
      const client = createServerClient(config);

      // Initialize client
      await client.initialize();

      // Load initial data if authenticated
      if (config.apiKey || config.token) {
        try {
          initialUser = await client.auth.getCurrentUser();
        } catch (err) {
          console.warn('[IssueFlow SSR] Failed to load user:', err);
        }

        try {
          initialIssues = await client.issues.list({ limit: 10 });
        } catch (err) {
          console.warn('[IssueFlow SSR] Failed to load issues:', err);
        }
      }

      // Cleanup client
      client.destroy();

    } catch (error) {
      console.error('[IssueFlow SSR] Initialization error:', error);
      ssrProps.error = error instanceof Error ? error.message : 'Failed to initialize IssueFlow';
    }

    // Execute original getServerSideProps if provided
    let originalProps = {};
    if (getServerSidePropsFunc) {
      const result = await getServerSidePropsFunc(context);
      if ('props' in result) {
        originalProps = result.props;
      } else {
        // Handle redirect or notFound
        return result;
      }
    }

    return {
      props: {
        ...originalProps,
        config,
        initialIssues,
        initialUser,
        ssr: ssrProps,
      } as P & IssueFlowSSRProps,
    };
  };
}

/**
 * Higher-order function for Next.js getStaticProps with IssueFlow
 */
export function withIssueFlowSSG<P = {}>(
  config: IssueFlowConfig,
  getStaticPropsFunc?: GetStaticProps<P>
): GetStaticProps<P & IssueFlowSSRProps> {
  return async (context) => {
    const ssrProps: IssueFlowSSRProps['ssr'] = {
      isLoading: false,
      error: null,
    };

    let initialIssues: Issue[] = [];
    let initialUser: User | null = null;

    try {
      // Only fetch data if we have authentication
      if (config.apiKey || config.token) {
        const client = createServerClient(config);
        await client.initialize();

        try {
          // Load public issues for SSG
          initialIssues = await client.issues.list({ 
            limit: 10, 
            public: true 
          });
        } catch (err) {
          console.warn('[IssueFlow SSG] Failed to load issues:', err);
        }

        client.destroy();
      }

    } catch (error) {
      console.error('[IssueFlow SSG] Initialization error:', error);
      ssrProps.error = error instanceof Error ? error.message : 'Failed to initialize IssueFlow';
    }

    // Execute original getStaticProps if provided
    let originalProps = {};
    if (getStaticPropsFunc) {
      const result = await getStaticPropsFunc(context);
      if ('props' in result) {
        originalProps = result.props;
      } else {
        // Handle redirect or notFound
        return result;
      }
    }

    return {
      props: {
        ...originalProps,
        config,
        initialIssues,
        initialUser,
        ssr: ssrProps,
      } as P & IssueFlowSSRProps,
      // Add revalidation for ISR
      revalidate: 60, // Revalidate every minute
    };
  };
}

/**
 * Utility to extract IssueFlow props from page props
 */
export function extractIssueFlowProps<P>(
  props: P & IssueFlowSSRProps
): {
  issueFlowProps: IssueFlowSSRProps;
  pageProps: P;
} {
  const { config, initialIssues, initialUser, ssr, ...pageProps } = props;
  
  return {
    issueFlowProps: {
      config,
      initialIssues,
      initialUser,
      ssr,
    },
    pageProps: pageProps as P,
  };
}

/**
 * Helper to determine if we're in SSR context
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * Helper to safely access window/document in SSR
 */
export function safeWindow<T>(callback: (window: Window) => T, fallback?: T): T | undefined {
  if (typeof window !== 'undefined') {
    return callback(window);
  }
  return fallback;
}

/**
 * Helper to safely access localStorage in SSR
 */
export function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return window.localStorage;
}

/**
 * Create a hydration-safe IssueFlow configuration
 */
export function createHydrationSafeConfig(config: IssueFlowConfig): IssueFlowConfig {
  return {
    ...config,
    // Disable features that don't work in SSR
    behavior: {
      ...config.behavior,
      captureConsoleErrors: !isSSR(),
      captureUnhandledRejections: !isSSR(),
    },
    // Ensure theme works with SSR
    theme: {
      ...config.theme,
      mode: config.theme?.mode || 'auto',
    },
  };
}

/**
 * App Router utilities
 */
export namespace AppRouter {
  /**
   * Helper for loading IssueFlow data in app router
   */
  export async function loadIssueFlowData(config: IssueFlowConfig): Promise<{
    initialIssues: Issue[];
    initialUser: User | null;
    error: string | null;
  }> {
    let initialIssues: Issue[] = [];
    let initialUser: User | null = null;
    let error: string | null = null;

    try {
      const client = createServerClient(config);
      await client.initialize();

      if (config.apiKey || config.token) {
        try {
          initialUser = await client.auth.getCurrentUser();
          initialIssues = await client.issues.list({ limit: 10 });
        } catch (err) {
          console.warn('[IssueFlow App Router] Data loading failed:', err);
        }
      }

      client.destroy();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load IssueFlow data';
      console.error('[IssueFlow App Router] Error:', error);
    }

    return {
      initialIssues,
      initialUser,
      error,
    };
  }

  /**
   * Metadata generator for IssueFlow pages
   */
  export function generateMetadata(title?: string, description?: string) {
    return {
      title: title || 'Feedback',
      description: description || 'Submit feedback and report issues',
      robots: 'noindex,nofollow', // Typically don't want feedback pages indexed
    };
  }
}

/**
 * Edge runtime utilities
 */
export namespace EdgeRuntime {
  /**
   * Create edge-compatible IssueFlow configuration
   */
  export function createEdgeConfig(config: IssueFlowConfig): IssueFlowConfig {
    return {
      ...config,
      // Disable Node.js specific features for edge runtime
      integrations: {
        ...config.integrations,
        // Disable file system based integrations
        fileSystem: false,
      },
    };
  }

  /**
   * Check if running in edge runtime
   */
  export function isEdgeRuntime(): boolean {
    return typeof EdgeRuntime !== 'undefined';
  }
}

/**
 * Middleware utilities
 */
export namespace Middleware {
  /**
   * Create IssueFlow middleware configuration
   */
  export function createMiddlewareConfig(config: IssueFlowConfig) {
    return {
      matcher: ['/api/issueflow/:path*'],
      config: {
        ...config,
        api: {
          bodyParser: {
            sizeLimit: config.behavior?.maxAttachmentSize || '5mb',
          },
        },
      },
    };
  }
}
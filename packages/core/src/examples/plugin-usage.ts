/**
 * Example: How to use the IssueFlow Plugin System
 * 
 * This file demonstrates how to:
 * 1. Create and register plugins
 * 2. Emit events to plugins
 * 3. Handle plugin responses
 */

import { IssueFlowApp } from '../app';
import { GitHubPlugin } from '../plugins/GitHubPlugin';
import { PluginType, IssueCreatedEvent, IssueStatus } from '../types/plugin.types';
import type { AppConfig } from '../config';

/**
 * Example of plugin usage in IssueFlow
 */
export class PluginUsageExample {
  private app: IssueFlowApp;

  constructor(config: AppConfig) {
    this.app = new IssueFlowApp(config);
  }

  /**
   * Initialize and demonstrate plugin system
   */
  async initialize(): Promise<void> {
    // Start the app
    await this.app.start();

    // Register GitHub plugin
    await this.registerGitHubPlugin();

    // Simulate issue creation
    await this.simulateIssueCreated();

    // Show plugin status
    await this.showPluginStatus();
  }

  /**
   * Register and activate GitHub plugin
   */
  private async registerGitHubPlugin(): Promise<void> {
    try {
      const githubPlugin = new GitHubPlugin();
      const pluginRegistry = this.app.getPluginRegistry();

      // Register the plugin with configuration
      await pluginRegistry.registerPlugin(githubPlugin, {
        token: 'github_pat_example_token',
        owner: 'issueflow',
        repo: 'example-project',
        createIssueOnReport: true,
        syncStatusChanges: true
      });

      // Activate the plugin
      await pluginRegistry.activatePlugin('github-integration@1.0.0');

      console.log('✅ GitHub plugin registered and activated');

    } catch (error) {
      console.error('❌ Failed to register GitHub plugin:', error);
    }
  }

  /**
   * Simulate an issue being created
   */
  private async simulateIssueCreated(): Promise<void> {
    try {
      // Create mock issue data
      const mockIssue = {
        id: 'issue_123',
        title: 'Login button not working',
        description: 'When users click the login button, nothing happens. Console shows no errors.',
        status: 'open' as IssueStatus,
        priority: 'high',
        reporterEmail: 'user@example.com',
        environment: 'Production',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockProject = {
        id: 'proj_456',
        name: 'E-commerce Website',
        description: 'Main company website'
      };

      // Create plugin event
      const event: IssueCreatedEvent = {
        name: 'issue.created',
        data: {
          issue: mockIssue,
          project: mockProject
        },
        timestamp: new Date(),
        organizationId: 'org_789',
        userId: 'user_321'
      };

      console.log('📝 Simulating issue creation...');
      
      // Emit event to all registered plugins
      await this.app.emitPluginEvent(event);
      
      console.log('✅ Issue creation event emitted to plugins');

    } catch (error) {
      console.error('❌ Failed to emit issue creation event:', error);
    }
  }

  /**
   * Show current plugin status
   */
  private async showPluginStatus(): Promise<void> {
    try {
      const pluginRegistry = this.app.getPluginRegistry();
      
      console.log('\n📊 Plugin Status Report:');
      console.log('========================');
      
      const plugins = pluginRegistry.getPlugins();
      console.log(`Total plugins: ${plugins.length}`);
      
      plugins.forEach(plugin => {
        console.log(`
📦 ${plugin.manifest.name} v${plugin.manifest.version}
   Type: ${plugin.manifest.type}
   Status: ${plugin.status}
   Installed: ${plugin.installedAt.toISOString()}
   ${plugin.errorMessage ? `❌ Error: ${plugin.errorMessage}` : '✅ Working'}
        `);
      });

      // Health check
      const health = await pluginRegistry.healthCheck();
      console.log(`\n🏥 Health Check:`);
      console.log(`   Healthy: ${health.healthy}`);
      console.log(`   Unhealthy: ${health.unhealthy}`);
      console.log(`   Total: ${health.total}`);

    } catch (error) {
      console.error('❌ Failed to get plugin status:', error);
    }
  }

  /**
   * Shutdown example
   */
  async shutdown(): Promise<void> {
    await this.app.shutdown();
  }
}

/**
 * Run the example
 */
export async function runPluginExample(): Promise<void> {
  // Example configuration
  const config: Partial<AppConfig> = {
    logger: {
      level: 'info',
      format: 'pretty'
    },
    server: {
      host: '0.0.0.0',
      port: 3000
    },
    database: {
      type: 'sqlite',
      database: ':memory:'
    },
    redis: {
      host: 'localhost',
      port: 6379
    }
  } as AppConfig;

  const example = new PluginUsageExample(config);
  
  try {
    await example.initialize();
    
    // Let it run for a moment
    setTimeout(async () => {
      await example.shutdown();
      console.log('✅ Plugin example completed');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Plugin example failed:', error);
    await example.shutdown();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runPluginExample().catch(console.error);
}
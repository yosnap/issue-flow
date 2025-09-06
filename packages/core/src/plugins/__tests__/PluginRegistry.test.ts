/**
 * Tests for PluginRegistry
 */

import { PluginRegistry } from '../PluginRegistry';
import { BasePlugin } from '../BasePlugin';
import { PluginType, PluginStatus, IssueCreatedEvent } from '../../types/plugin.types';

class MockPlugin extends BasePlugin {
  readonly name = 'mock-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.INTEGRATION;

  private onIssueCreatedCalled = false;

  async onIssueCreated(event: IssueCreatedEvent): Promise<void> {
    this.onIssueCreatedCalled = true;
    this.log('info', 'Mock plugin received issue created event', { issueId: event.data.issue.id });
  }

  getOnIssueCreatedCalled(): boolean {
    return this.onIssueCreatedCalled;
  }

  resetMocks(): void {
    this.onIssueCreatedCalled = false;
  }
}

class FailingPlugin extends BasePlugin {
  readonly name = 'failing-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.WORKFLOW;

  async onActivate(): Promise<void> {
    throw new Error('Activation failed');
  }

  async onIssueCreated(): Promise<void> {
    throw new Error('Event handling failed');
  }
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  let mockPlugin: MockPlugin;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    registry = new PluginRegistry();
    mockPlugin = new MockPlugin();
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    mockPlugin.resetMocks();
  });

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', async () => {
      await registry.registerPlugin(mockPlugin);
      
      const plugins = registry.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.name).toBe('mock-plugin');
      expect(plugins[0].status).toBe(PluginStatus.INSTALLED);
    });

    it('should generate correct plugin ID', async () => {
      await registry.registerPlugin(mockPlugin);
      
      const plugin = registry.getPlugin('mock-plugin@1.0.0');
      expect(plugin).toBeDefined();
      expect(plugin!.id).toBe('mock-plugin@1.0.0');
    });

    it('should validate plugin configuration', async () => {
      const invalidConfig = null;
      
      await expect(registry.registerPlugin(mockPlugin, invalidConfig as any))
        .rejects.toThrow('Invalid configuration');
    });

    it('should handle plugin registration failure', async () => {
      const invalidPlugin = {} as any;
      
      await expect(registry.registerPlugin(invalidPlugin))
        .rejects.toThrow();
    });
  });

  describe('Plugin Activation', () => {
    beforeEach(async () => {
      await registry.registerPlugin(mockPlugin);
    });

    it('should activate a plugin successfully', async () => {
      await registry.activatePlugin('mock-plugin@1.0.0');
      
      const plugin = registry.getPlugin('mock-plugin@1.0.0');
      expect(plugin!.status).toBe(PluginStatus.ACTIVE);
      expect(mockPlugin.isActive).toBe(true);
    });

    it('should handle already active plugin', async () => {
      await registry.activatePlugin('mock-plugin@1.0.0');
      
      // Should not throw when activating already active plugin
      await expect(registry.activatePlugin('mock-plugin@1.0.0'))
        .resolves.not.toThrow();
      
      expect(registry.getPlugin('mock-plugin@1.0.0')!.status).toBe(PluginStatus.ACTIVE);
    });

    it('should handle plugin activation failure', async () => {
      const failingPlugin = new FailingPlugin();
      await registry.registerPlugin(failingPlugin);
      
      await expect(registry.activatePlugin('failing-plugin@1.0.0'))
        .rejects.toThrow('Activation failed');
      
      const plugin = registry.getPlugin('failing-plugin@1.0.0');
      expect(plugin!.status).toBe(PluginStatus.ERROR);
      expect(plugin!.errorMessage).toBe('Activation failed');
    });

    it('should throw error for non-existent plugin', async () => {
      await expect(registry.activatePlugin('non-existent@1.0.0'))
        .rejects.toThrow('Plugin non-existent@1.0.0 not found');
    });
  });

  describe('Plugin Deactivation', () => {
    beforeEach(async () => {
      await registry.registerPlugin(mockPlugin);
      await registry.activatePlugin('mock-plugin@1.0.0');
    });

    it('should deactivate a plugin successfully', async () => {
      await registry.deactivatePlugin('mock-plugin@1.0.0');
      
      const plugin = registry.getPlugin('mock-plugin@1.0.0');
      expect(plugin!.status).toBe(PluginStatus.INACTIVE);
      expect(mockPlugin.isActive).toBe(false);
    });

    it('should handle already inactive plugin', async () => {
      await registry.deactivatePlugin('mock-plugin@1.0.0');
      
      // Should not throw when deactivating already inactive plugin
      await expect(registry.deactivatePlugin('mock-plugin@1.0.0'))
        .resolves.not.toThrow();
      
      expect(registry.getPlugin('mock-plugin@1.0.0')!.status).toBe(PluginStatus.INACTIVE);
    });
  });

  describe('Plugin Queries', () => {
    beforeEach(async () => {
      await registry.registerPlugin(mockPlugin);
      await registry.activatePlugin('mock-plugin@1.0.0');
    });

    it('should get all plugins', () => {
      const plugins = registry.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.name).toBe('mock-plugin');
    });

    it('should get active plugins only', () => {
      const activePlugins = registry.getActivePlugins();
      expect(activePlugins).toHaveLength(1);
      expect(activePlugins[0].status).toBe(PluginStatus.ACTIVE);
    });

    it('should get plugin by ID', () => {
      const plugin = registry.getPlugin('mock-plugin@1.0.0');
      expect(plugin).toBeDefined();
      expect(plugin!.manifest.name).toBe('mock-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = registry.getPlugin('non-existent@1.0.0');
      expect(plugin).toBeUndefined();
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      await registry.registerPlugin(mockPlugin);
      await registry.activatePlugin('mock-plugin@1.0.0');
    });

    it('should emit events to active plugins', async () => {
      const event: IssueCreatedEvent = {
        name: 'issue.created',
        data: {
          issue: {
            id: 'test-issue-1',
            title: 'Test Issue',
            description: 'Test Description',
            status: 'open',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          project: {
            id: 'test-project-1',
            name: 'Test Project',
            description: 'Test Project Description'
          }
        },
        timestamp: new Date(),
        organizationId: 'test-org',
        userId: 'test-user'
      };

      expect(mockPlugin.getOnIssueCreatedCalled()).toBe(false);
      
      await registry.emitToPlugins(event);
      
      expect(mockPlugin.getOnIssueCreatedCalled()).toBe(true);
    });

    it('should handle plugin event handling failures gracefully', async () => {
      const failingPlugin = new FailingPlugin();
      await registry.registerPlugin(failingPlugin);
      await registry.registerPlugin(failingPlugin, {});
      
      // Force activate by bypassing the activation error for this test
      const pluginRecord = registry.getPlugin('failing-plugin@1.0.0');
      pluginRecord!.status = PluginStatus.ACTIVE;

      const event: IssueCreatedEvent = {
        name: 'issue.created',
        data: {
          issue: {
            id: 'test-issue-1',
            title: 'Test Issue',
            description: 'Test Description', 
            status: 'open',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          project: {
            id: 'test-project-1',
            name: 'Test Project',
            description: 'Test Project Description'
          }
        },
        timestamp: new Date(),
        organizationId: 'test-org',
        userId: 'test-user'
      };

      // Should not throw, but should handle error internally
      await expect(registry.emitToPlugins(event)).resolves.not.toThrow();
      
      // Plugin should be marked as error
      expect(pluginRecord!.status).toBe(PluginStatus.ERROR);
      expect(pluginRecord!.errorMessage).toBe('Event handling error');
    });

    it('should not emit to inactive plugins', async () => {
      await registry.deactivatePlugin('mock-plugin@1.0.0');
      
      const event: IssueCreatedEvent = {
        name: 'issue.created',
        data: {
          issue: {
            id: 'test-issue-1',
            title: 'Test Issue',
            description: 'Test Description',
            status: 'open',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          project: {
            id: 'test-project-1',
            name: 'Test Project',
            description: 'Test Project Description'
          }
        },
        timestamp: new Date(),
        organizationId: 'test-org'
      };

      await registry.emitToPlugins(event);
      
      // Should not have been called since plugin is inactive
      expect(mockPlugin.getOnIssueCreatedCalled()).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return correct health status with no plugins', async () => {
      const health = await registry.healthCheck();
      
      expect(health.total).toBe(0);
      expect(health.healthy).toBe(0);
      expect(health.unhealthy).toBe(0);
    });

    it('should return correct health status with healthy plugins', async () => {
      await registry.registerPlugin(mockPlugin);
      await registry.activatePlugin('mock-plugin@1.0.0');
      
      const health = await registry.healthCheck();
      
      expect(health.total).toBe(1);
      expect(health.healthy).toBe(1);
      expect(health.unhealthy).toBe(0);
    });

    it('should return correct health status with unhealthy plugins', async () => {
      const failingPlugin = new FailingPlugin();
      await registry.registerPlugin(failingPlugin);
      
      try {
        await registry.activatePlugin('failing-plugin@1.0.0');
      } catch {
        // Expected to fail
      }
      
      const health = await registry.healthCheck();
      
      expect(health.total).toBe(1);
      expect(health.healthy).toBe(0);
      expect(health.unhealthy).toBe(1);
    });
  });
});
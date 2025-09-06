/**
 * Tests for BasePlugin
 */

import { BasePlugin } from '../BasePlugin';
import { PluginType } from '../../types/plugin.types';

class TestPlugin extends BasePlugin {
  readonly name = 'test-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.INTEGRATION;

  public installCalled = false;
  public activateCalled = false;
  public deactivateCalled = false;
  public uninstallCalled = false;

  protected async onInstall(): Promise<void> {
    this.installCalled = true;
  }

  protected async onActivate(): Promise<void> {
    this.activateCalled = true;
  }

  protected async onDeactivate(): Promise<void> {
    this.deactivateCalled = true;
  }

  protected async onUninstall(): Promise<void> {
    this.uninstallCalled = true;
  }

  public resetMocks(): void {
    this.installCalled = false;
    this.activateCalled = false;
    this.deactivateCalled = false;
    this.uninstallCalled = false;
  }
}

class FailingPlugin extends BasePlugin {
  readonly name = 'failing-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.WORKFLOW;

  protected async onInstall(): Promise<void> {
    throw new Error('Install failed');
  }

  protected async onActivate(): Promise<void> {
    throw new Error('Activate failed');
  }
}

class CustomValidationPlugin extends BasePlugin {
  readonly name = 'custom-validation-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.NOTIFICATION;

  validateConfig(config: any): boolean {
    return !!(config && config.apiKey && config.apiKey.length > 10);
  }

  getConfigSchema(): object {
    return {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          minLength: 10
        }
      },
      required: ['apiKey']
    };
  }
}

describe('BasePlugin', () => {
  let plugin: TestPlugin;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    plugin = new TestPlugin();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    plugin.resetMocks();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Properties', () => {
    it('should have correct basic properties', () => {
      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe(PluginType.INTEGRATION);
    });

    it('should start in uninstalled state', () => {
      expect(plugin.isInstalled).toBe(false);
      expect(plugin.isActive).toBe(false);
      expect(plugin.config).toEqual({});
    });
  });

  describe('Installation', () => {
    it('should install successfully with valid config', async () => {
      const config = { key: 'value' };
      
      await plugin.install(config);
      
      expect(plugin.isInstalled).toBe(true);
      expect(plugin.installCalled).toBe(true);
      expect(plugin.config).toEqual(config);
    });

    it('should reject invalid config', async () => {
      const invalidConfig = null;
      
      await expect(plugin.install(invalidConfig as any))
        .rejects.toThrow('Invalid configuration');
      
      expect(plugin.isInstalled).toBe(false);
      expect(plugin.installCalled).toBe(false);
    });

    it('should not allow double installation', async () => {
      await plugin.install({});
      
      await expect(plugin.install({}))
        .rejects.toThrow('already installed');
      
      expect(plugin.installCalled).toBe(true); // Called only once
    });

    it('should handle installation failure', async () => {
      const failingPlugin = new FailingPlugin();
      
      await expect(failingPlugin.install({}))
        .rejects.toThrow('Install failed');
      
      expect(failingPlugin.isInstalled).toBe(false);
    });
  });

  describe('Activation', () => {
    beforeEach(async () => {
      await plugin.install({});
    });

    it('should activate successfully when installed', async () => {
      await plugin.activate();
      
      expect(plugin.isActive).toBe(true);
      expect(plugin.activateCalled).toBe(true);
    });

    it('should not activate if not installed', async () => {
      const uninstalledPlugin = new TestPlugin();
      
      await expect(uninstalledPlugin.activate())
        .rejects.toThrow('must be installed before activation');
      
      expect(uninstalledPlugin.isActive).toBe(false);
    });

    it('should handle already active plugin gracefully', async () => {
      await plugin.activate();
      plugin.resetMocks();
      
      await plugin.activate(); // Should not throw
      
      expect(plugin.isActive).toBe(true);
      expect(plugin.activateCalled).toBe(false); // Not called second time
    });

    it('should handle activation failure', async () => {
      const failingPlugin = new FailingPlugin();
      await failingPlugin.install({});
      
      await expect(failingPlugin.activate())
        .rejects.toThrow('Activate failed');
      
      expect(failingPlugin.isActive).toBe(false);
    });
  });

  describe('Deactivation', () => {
    beforeEach(async () => {
      await plugin.install({});
      await plugin.activate();
    });

    it('should deactivate successfully when active', async () => {
      await plugin.deactivate();
      
      expect(plugin.isActive).toBe(false);
      expect(plugin.deactivateCalled).toBe(true);
    });

    it('should handle already inactive plugin gracefully', async () => {
      await plugin.deactivate();
      plugin.resetMocks();
      
      await plugin.deactivate(); // Should not throw
      
      expect(plugin.isActive).toBe(false);
      expect(plugin.deactivateCalled).toBe(false); // Not called second time
    });
  });

  describe('Uninstallation', () => {
    beforeEach(async () => {
      await plugin.install({ key: 'value' });
      await plugin.activate();
    });

    it('should uninstall successfully', async () => {
      await plugin.uninstall();
      
      expect(plugin.isInstalled).toBe(false);
      expect(plugin.isActive).toBe(false);
      expect(plugin.config).toEqual({});
      expect(plugin.uninstallCalled).toBe(true);
      expect(plugin.deactivateCalled).toBe(true); // Should deactivate first
    });

    it('should handle uninstalling non-installed plugin gracefully', async () => {
      const uninstalledPlugin = new TestPlugin();
      
      await uninstalledPlugin.uninstall(); // Should not throw
      
      expect(uninstalledPlugin.isInstalled).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should have default config schema', () => {
      const schema = plugin.getConfigSchema();
      
      expect(schema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: true
      });
    });

    it('should validate config by default', () => {
      expect(plugin.validateConfig({})).toBe(true);
      expect(plugin.validateConfig({ key: 'value' })).toBe(true);
      expect(plugin.validateConfig(null)).toBe(false);
      expect(plugin.validateConfig('string')).toBe(false);
    });

    it('should support custom config validation', () => {
      const customPlugin = new CustomValidationPlugin();
      
      expect(customPlugin.validateConfig({})).toBe(false);
      expect(customPlugin.validateConfig({ apiKey: 'short' })).toBe(false);
      expect(customPlugin.validateConfig({ apiKey: 'long-enough-key' })).toBe(true);
    });

    it('should support custom config schema', () => {
      const customPlugin = new CustomValidationPlugin();
      const schema = customPlugin.getConfigSchema();
      
      expect(schema).toHaveProperty('properties.apiKey');
      expect(schema).toHaveProperty('required');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await plugin.install({ 
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true
      });
    });

    it('should get config values with defaults', () => {
      expect(plugin.getConfigValue('stringValue', 'default')).toBe('test');
      expect(plugin.getConfigValue('numberValue', 0)).toBe(42);
      expect(plugin.getConfigValue('booleanValue', false)).toBe(true);
      expect(plugin.getConfigValue('nonExistent', 'default')).toBe('default');
    });

    it('should log messages with plugin context', () => {
      plugin.log('info', 'Test info message');
      plugin.log('warn', 'Test warning', { extra: 'data' });
      plugin.log('error', 'Test error');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[Plugin:test-plugin]', 'Test info message', '');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Plugin:test-plugin]', 'Test warning', { extra: 'data' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Plugin:test-plugin]', 'Test error', '');
    });
  });

  describe('Event Handlers', () => {
    it('should have optional event handler methods', () => {
      expect(typeof plugin.onIssueCreated).toBe('undefined');
      expect(typeof plugin.onIssueUpdated).toBe('undefined');
      expect(typeof plugin.onIssueStatusChanged).toBe('undefined');
      expect(typeof plugin.onUserAction).toBe('undefined');
      expect(typeof plugin.onWebhookReceived).toBe('undefined');
    });
  });
});
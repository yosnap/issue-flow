/**
 * Simple test runner for plugin system
 * Uses basic Node.js assertions since Jest has dependency conflicts
 */

// Simple assertion functions
const assert = {
  equal(actual: any, expected: any, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  deepEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  ok(value: any, message?: string) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  }
};
import { PluginRegistry } from '../PluginRegistry';
import { BasePlugin } from '../BasePlugin';
import { GitHubPlugin } from '../GitHubPlugin';
import { PluginType, PluginStatus, IssueCreatedEvent } from '../../types/plugin.types';
import { IssueStatus, IssuePriority, IssueCategory } from '../../types/issue.types';

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

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class SimpleTestRunner {
  private results: TestResult[] = [];

  async test(name: string, testFn: () => Promise<void> | void): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  getResults() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    return { passed, failed, total: this.results.length, results: this.results };
  }

  printSummary() {
    const { passed, failed, total } = this.getResults();
    console.log(`\n📊 Test Results: ${passed}/${total} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log(`\n❌ Failed tests:`);
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
  }
}

async function runPluginSystemTests() {
  console.log('🧪 Running Plugin System Tests...\n');
  
  const runner = new SimpleTestRunner();

  await runner.test('PluginRegistry should be instantiable', () => {
    const registry = new PluginRegistry();
    assert.ok(registry instanceof PluginRegistry);
  });

  await runner.test('MockPlugin should be instantiable', () => {
    const plugin = new MockPlugin();
    assert.ok(plugin instanceof MockPlugin);
    assert.equal(plugin.name, 'mock-plugin');
    assert.equal(plugin.version, '1.0.0');
    assert.equal(plugin.type, PluginType.INTEGRATION);
  });

  await runner.test('Plugin should start in uninstalled state', () => {
    const plugin = new MockPlugin();
    assert.equal(plugin.isInstalled, false);
    assert.equal(plugin.isActive, false);
  });

  await runner.test('Plugin should install successfully', async () => {
    const plugin = new MockPlugin();
    const config = { key: 'value' };
    
    await plugin.install(config);
    
    assert.equal(plugin.isInstalled, true);
    assert.deepEqual(plugin.config, config);
  });

  await runner.test('Plugin should activate after installation', async () => {
    const plugin = new MockPlugin();
    
    await plugin.install({});
    await plugin.activate();
    
    assert.equal(plugin.isActive, true);
  });

  await runner.test('PluginRegistry should register plugin', async () => {
    const registry = new PluginRegistry();
    const plugin = new MockPlugin();
    
    await registry.registerPlugin(plugin);
    
    const plugins = registry.getPlugins();
    assert.equal(plugins.length, 1);
    assert.equal(plugins[0].manifest.name, 'mock-plugin');
    assert.equal(plugins[0].status, PluginStatus.INSTALLED);
  });

  await runner.test('PluginRegistry should activate plugin', async () => {
    const registry = new PluginRegistry();
    const plugin = new MockPlugin();
    
    await registry.registerPlugin(plugin);
    await registry.activatePlugin('mock-plugin@1.0.0');
    
    const registeredPlugin = registry.getPlugin('mock-plugin@1.0.0');
    assert.ok(registeredPlugin);
    if (registeredPlugin) {
      assert.equal(registeredPlugin.status, PluginStatus.ACTIVE);
    }
  });

  await runner.test('PluginRegistry should emit events to active plugins', async () => {
    const registry = new PluginRegistry();
    const plugin = new MockPlugin();
    
    await registry.registerPlugin(plugin);
    await registry.activatePlugin('mock-plugin@1.0.0');
    
    const event: IssueCreatedEvent = {
      name: 'issue.created',
      data: {
        issue: {
          id: 'test-issue-1',
          projectId: 'test-project-1',
          title: 'Test Issue',
          description: 'Test Description',
          status: IssueStatus.OPEN,
          priority: IssuePriority.MEDIUM,
          category: IssueCategory.BUG,
          reporterEmail: 'test@example.com',
          labels: [],
          attachments: [],
          comments: [],
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

    assert.equal(plugin.getOnIssueCreatedCalled(), false);
    
    await registry.emitToPlugins(event);
    
    assert.equal(plugin.getOnIssueCreatedCalled(), true);
  });

  await runner.test('GitHubPlugin should be instantiable', () => {
    const plugin = new GitHubPlugin();
    assert.ok(plugin instanceof GitHubPlugin);
    assert.equal(plugin.name, 'github-integration');
    assert.equal(plugin.version, '1.0.0');
    assert.equal(plugin.type, PluginType.INTEGRATION);
  });

  await runner.test('GitHubPlugin should validate config correctly', () => {
    const plugin = new GitHubPlugin();
    
    assert.equal(plugin.validateConfig({}), false);
    assert.equal(plugin.validateConfig({
      token: 'github_pat_token',
      owner: 'issueflow',
      repo: 'example'
    }), true);
  });

  await runner.test('GitHubPlugin should install with valid config', async () => {
    const plugin = new GitHubPlugin();
    const config = {
      token: 'github_pat_token',
      owner: 'issueflow',
      repo: 'example'
    };
    
    await plugin.install(config);
    
    assert.equal(plugin.isInstalled, true);
    assert.deepEqual(plugin.config, config);
  });

  await runner.test('Plugin health check should work', async () => {
    const registry = new PluginRegistry();
    const plugin = new MockPlugin();
    
    await registry.registerPlugin(plugin);
    await registry.activatePlugin('mock-plugin@1.0.0');
    
    const health = await registry.healthCheck();
    
    assert.equal(health.total, 1);
    assert.equal(health.healthy, 1);
    assert.equal(health.unhealthy, 0);
  });

  runner.printSummary();
  
  const { failed } = runner.getResults();
  if (failed > 0) {
    throw new Error('Some tests failed');
  } else {
    console.log('\n🎉 All plugin tests passed!');
  }
}

// Export for external use
export { runPluginSystemTests };

// Auto-execute the tests when run directly
runPluginSystemTests().catch(console.error);
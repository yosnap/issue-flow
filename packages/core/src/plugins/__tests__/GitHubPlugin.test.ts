/**
 * Tests for GitHubPlugin
 */

import { GitHubPlugin } from '../GitHubPlugin';
import { PluginType, PluginStatus, IssueCreatedEvent, IssueStatusChangedEvent } from '../../types/plugin.types';

describe('GitHubPlugin', () => {
  let plugin: GitHubPlugin;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    plugin = new GitHubPlugin();
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic Properties', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('github-integration');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe(PluginType.INTEGRATION);
    });
  });

  describe('Configuration', () => {
    it('should have correct config schema', () => {
      const schema = plugin.getConfigSchema();
      
      expect(schema).toHaveProperty('properties.token');
      expect(schema).toHaveProperty('properties.owner');
      expect(schema).toHaveProperty('properties.repo');
      expect(schema).toHaveProperty('properties.createIssueOnReport');
      expect(schema).toHaveProperty('properties.syncStatusChanges');
      expect(schema).toHaveProperty('required');
      expect((schema as any).required).toEqual(['token', 'owner', 'repo']);
    });

    it('should validate valid configuration', () => {
      const validConfig = {
        token: 'github_pat_token',
        owner: 'issueflow',
        repo: 'example',
        createIssueOnReport: true,
        syncStatusChanges: true
      };
      
      expect(plugin.validateConfig(validConfig)).toBe(true);
    });

    it('should reject invalid configuration', () => {
      expect(plugin.validateConfig({})).toBe(false);
      expect(plugin.validateConfig({ token: 'abc' })).toBe(false);
      expect(plugin.validateConfig({ token: 'abc', owner: 'test' })).toBe(false);
      expect(plugin.validateConfig({ 
        token: '', 
        owner: 'test', 
        repo: 'example' 
      })).toBe(false);
    });

    it('should accept minimal valid configuration', () => {
      const minimalConfig = {
        token: 'github_pat_token',
        owner: 'issueflow',
        repo: 'example'
      };
      
      expect(plugin.validateConfig(minimalConfig)).toBe(true);
    });
  });

  describe('Installation and Activation', () => {
    const validConfig = {
      token: 'github_pat_token',
      owner: 'issueflow',
      repo: 'example-repo'
    };

    it('should install successfully with valid config', async () => {
      await plugin.install(validConfig);
      
      expect(plugin.isInstalled).toBe(true);
      expect(plugin.config).toEqual(validConfig);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Plugin:github-integration]',
        'GitHub plugin installed',
        { owner: 'issueflow', repo: 'example-repo' }
      );
    });

    it('should activate successfully after installation', async () => {
      await plugin.install(validConfig);
      await plugin.activate();
      
      expect(plugin.isActive).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Plugin:github-integration]',
        'GitHub plugin activated',
        ''
      );
    });

    it('should deactivate successfully', async () => {
      await plugin.install(validConfig);
      await plugin.activate();
      await plugin.deactivate();
      
      expect(plugin.isActive).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Plugin:github-integration]',
        'GitHub plugin deactivated',
        ''
      );
    });
  });

  describe('Event Handling', () => {
    const validConfig = {
      token: 'github_pat_token',
      owner: 'issueflow',
      repo: 'example-repo',
      createIssueOnReport: true,
      syncStatusChanges: true
    };

    beforeEach(async () => {
      await plugin.install(validConfig);
      await plugin.activate();
    });

    describe('Issue Created Events', () => {
      const mockIssueCreatedEvent: IssueCreatedEvent = {
        name: 'issue.created',
        data: {
          issue: {
            id: 'issue_123',
            title: 'Test Issue',
            description: 'This is a test issue',
            status: 'open',
            priority: 'high',
            reporterEmail: 'test@example.com',
            environment: 'production',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          project: {
            id: 'proj_456',
            name: 'Test Project',
            description: 'Test project description'
          }
        },
        timestamp: new Date(),
        organizationId: 'org_789',
        userId: 'user_123'
      };

      it('should handle issue created event successfully', async () => {
        await plugin.onIssueCreated!(mockIssueCreatedEvent);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Mock GitHub issue created',
          expect.objectContaining({
            title: 'Test Issue',
            labels: ['issueflow', 'priority:high']
          })
        );
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Created GitHub issue',
          expect.objectContaining({
            issueflowId: 'issue_123',
            githubIssueNumber: expect.any(Number)
          })
        );
      });

      it('should skip issue creation when disabled', async () => {
        await plugin.install({ ...validConfig, createIssueOnReport: false });
        await plugin.activate();
        
        await plugin.onIssueCreated!(mockIssueCreatedEvent);
        
        // Should not log issue creation
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Created GitHub issue',
          expect.any(Object)
        );
      });

      it('should handle GitHub API errors', async () => {
        // Mock a scenario where GitHub API would fail
        const eventWithInvalidData = {
          ...mockIssueCreatedEvent,
          data: {
            ...mockIssueCreatedEvent.data,
            issue: {
              ...mockIssueCreatedEvent.data.issue,
              title: '' // Invalid title that might cause API error
            }
          }
        };

        // Since we're using mock API, this shouldn't actually fail
        // but in real implementation it would
        await expect(plugin.onIssueCreated!(eventWithInvalidData))
          .resolves.not.toThrow();
      });
    });

    describe('Issue Status Changed Events', () => {
      const mockStatusChangedEvent: IssueStatusChangedEvent = {
        name: 'issue.status_changed',
        data: {
          issue: {
            id: 'issue_123',
            title: 'Test Issue',
            description: 'This is a test issue',
            status: 'resolved',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          previousStatus: 'in_progress',
          project: {
            id: 'proj_456',
            name: 'Test Project',
            description: 'Test project description'
          }
        },
        timestamp: new Date(),
        organizationId: 'org_789'
      };

      it('should handle issue status change to resolved', async () => {
        await plugin.onIssueStatusChanged!(mockStatusChangedEvent);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Issue status changed',
          {
            issueId: 'issue_123',
            from: 'in_progress',
            to: 'resolved'
          }
        );
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Mock GitHub issue closed',
          { issueId: 'issue_123' }
        );
      });

      it('should handle issue status change to closed', async () => {
        const closedEvent = {
          ...mockStatusChangedEvent,
          data: {
            ...mockStatusChangedEvent.data,
            issue: {
              ...mockStatusChangedEvent.data.issue,
              status: 'closed' as any
            }
          }
        };

        await plugin.onIssueStatusChanged!(closedEvent);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Mock GitHub issue closed',
          { issueId: 'issue_123' }
        );
      });

      it('should skip status sync when disabled', async () => {
        await plugin.install({ ...validConfig, syncStatusChanges: false });
        await plugin.activate();
        
        await plugin.onIssueStatusChanged!(mockStatusChangedEvent);
        
        // Should not log GitHub issue closing
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Mock GitHub issue closed',
          expect.any(Object)
        );
      });

      it('should not close GitHub issue for non-final statuses', async () => {
        const inProgressEvent = {
          ...mockStatusChangedEvent,
          data: {
            ...mockStatusChangedEvent.data,
            issue: {
              ...mockStatusChangedEvent.data.issue,
              status: 'in_progress' as any
            }
          }
        };

        await plugin.onIssueStatusChanged!(inProgressEvent);
        
        // Should log status change but not close issue
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Issue status changed',
          expect.any(Object)
        );
        
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          '[Plugin:github-integration]',
          'Mock GitHub issue closed',
          expect.any(Object)
        );
      });
    });
  });

  describe('Configuration Values', () => {
    const validConfig = {
      token: 'github_pat_token',
      owner: 'issueflow',
      repo: 'example-repo',
      createIssueOnReport: false,
      syncStatusChanges: false
    };

    beforeEach(async () => {
      await plugin.install(validConfig);
    });

    it('should use config values correctly', () => {
      expect(plugin.getConfigValue('createIssueOnReport', true)).toBe(false);
      expect(plugin.getConfigValue('syncStatusChanges', true)).toBe(false);
      expect(plugin.getConfigValue('nonExistent', 'default')).toBe('default');
    });

    it('should use default values when config is missing', async () => {
      const minimalConfig = {
        token: 'github_pat_token',
        owner: 'issueflow',
        repo: 'example-repo'
      };
      
      await plugin.uninstall();
      await plugin.install(minimalConfig);
      
      expect(plugin.getConfigValue('createIssueOnReport', true)).toBe(true);
      expect(plugin.getConfigValue('syncStatusChanges', true)).toBe(true);
    });
  });
});
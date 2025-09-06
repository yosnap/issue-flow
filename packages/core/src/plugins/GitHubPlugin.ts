import { BasePlugin } from './BasePlugin';
import {
  PluginType,
  PluginConfig,
  IssueCreatedEvent,
  IssueUpdatedEvent,
  IssueStatusChangedEvent
} from '../types/plugin.types';

interface GitHubPluginConfig extends PluginConfig {
  token: string;
  owner: string;
  repo: string;
  createIssueOnReport?: boolean;
  syncStatusChanges?: boolean;
}

/**
 * GitHub Integration Plugin
 * Automatically creates and syncs GitHub issues when IssueFlow issues are created/updated
 */
export class GitHubPlugin extends BasePlugin {
  readonly name = 'github-integration';
  readonly version = '1.0.0';
  readonly type = PluginType.INTEGRATION;

  private githubClient: any = null;

  /**
   * Get configuration schema
   */
  getConfigSchema(): object {
    return {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'GitHub Personal Access Token'
        },
        owner: {
          type: 'string',
          description: 'GitHub repository owner'
        },
        repo: {
          type: 'string',
          description: 'GitHub repository name'
        },
        createIssueOnReport: {
          type: 'boolean',
          description: 'Create GitHub issue when IssueFlow issue is created',
          default: true
        },
        syncStatusChanges: {
          type: 'boolean',
          description: 'Sync status changes to GitHub',
          default: true
        }
      },
      required: ['token', 'owner', 'repo'],
      additionalProperties: false
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: PluginConfig): boolean {
    const githubConfig = config as GitHubPluginConfig;
    
    return !!(
      githubConfig.token &&
      githubConfig.owner &&
      githubConfig.repo &&
      typeof githubConfig.token === 'string' &&
      typeof githubConfig.owner === 'string' &&
      typeof githubConfig.repo === 'string'
    );
  }

  /**
   * Install plugin
   */
  protected async onInstall(config: PluginConfig): Promise<void> {
    const githubConfig = config as GitHubPluginConfig;
    
    // Initialize GitHub client (simplified mock)
    this.githubClient = {
      token: githubConfig.token,
      owner: githubConfig.owner,
      repo: githubConfig.repo
    };

    this.log('info', 'GitHub plugin installed', {
      owner: githubConfig.owner,
      repo: githubConfig.repo
    });
  }

  /**
   * Activate plugin
   */
  protected async onActivate(): Promise<void> {
    this.log('info', 'GitHub plugin activated');
  }

  /**
   * Deactivate plugin
   */
  protected async onDeactivate(): Promise<void> {
    this.log('info', 'GitHub plugin deactivated');
  }

  /**
   * Handle issue creation
   */
  async onIssueCreated(event: IssueCreatedEvent): Promise<void> {
    if (!this.getConfigValue('createIssueOnReport', true)) {
      return;
    }

    try {
      const { issue, project } = event.data;
      
      // Create GitHub issue
      const githubIssue = await this.createGitHubIssue({
        title: issue.title,
        body: `**Reported via IssueFlow**

${issue.description}

**Project:** ${project.name}
**Reporter:** ${issue.reporterEmail || 'Anonymous'}
**Priority:** ${issue.priority}
**Environment:** ${issue.environment || 'Not specified'}

---
*This issue was automatically created from IssueFlow report #${issue.id}*`,
        labels: ['issueflow', `priority:${issue.priority}`]
      });

      this.log('info', 'Created GitHub issue', {
        issueflowId: issue.id,
        githubIssueNumber: githubIssue.number
      });

      // In a real implementation, you would store the GitHub issue ID
      // in the IssueFlow issue metadata for future reference

    } catch (error) {
      this.log('error', 'Failed to create GitHub issue', error);
      throw error;
    }
  }

  /**
   * Handle issue updates
   */
  async onIssueUpdated(event: IssueUpdatedEvent): Promise<void> {
    try {
      const { issue, previousValues } = event.data;
      
      // Check if priority changed
      if (previousValues.priority && previousValues.priority !== issue.priority) {
        this.log('info', 'Issue priority changed', {
          issueId: issue.id,
          from: previousValues.priority,
          to: issue.priority
        });
        
        // Update GitHub issue labels (simplified)
        await this.updateGitHubIssueLabels(issue.id, [`priority:${issue.priority}`]);
      }

    } catch (error) {
      this.log('error', 'Failed to handle issue update', error);
    }
  }

  /**
   * Handle status changes
   */
  async onIssueStatusChanged(event: IssueStatusChangedEvent): Promise<void> {
    if (!this.getConfigValue('syncStatusChanges', true)) {
      return;
    }

    try {
      const { issue, previousStatus } = event.data;
      
      this.log('info', 'Issue status changed', {
        issueId: issue.id,
        from: previousStatus,
        to: issue.status
      });

      // Close GitHub issue if IssueFlow issue is resolved
      if (issue.status === 'resolved' || issue.status === 'closed') {
        await this.closeGitHubIssue(issue.id);
      }

    } catch (error) {
      this.log('error', 'Failed to sync status change', error);
    }
  }

  /**
   * Create GitHub issue (simplified mock implementation)
   */
  private async createGitHubIssue(issueData: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number; id: number }> {
    // In a real implementation, this would use the GitHub API
    // For now, we'll simulate the API call
    
    await this.simulateApiDelay();
    
    const mockIssueNumber = Math.floor(Math.random() * 1000) + 1;
    
    this.log('info', 'Mock GitHub issue created', {
      title: issueData.title,
      number: mockIssueNumber,
      labels: issueData.labels
    });

    return {
      number: mockIssueNumber,
      id: mockIssueNumber * 100
    };
  }

  /**
   * Update GitHub issue labels (simplified mock)
   */
  private async updateGitHubIssueLabels(issueId: string, labels: string[]): Promise<void> {
    await this.simulateApiDelay();
    
    this.log('info', 'Mock GitHub issue labels updated', {
      issueId,
      labels
    });
  }

  /**
   * Close GitHub issue (simplified mock)
   */
  private async closeGitHubIssue(issueId: string): Promise<void> {
    await this.simulateApiDelay();
    
    this.log('info', 'Mock GitHub issue closed', { issueId });
  }

  /**
   * Simulate API delay
   */
  private async simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}
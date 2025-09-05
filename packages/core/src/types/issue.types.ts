/**
 * Issue Management Types
 */

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IssueCategory {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  OTHER = 'other'
}

export interface Issue {
  id: string;
  projectId: string;
  externalId?: string; // GitHub issue #, ClickUp task ID, etc.
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: IssueCategory;
  reporterEmail: string;
  reporterMetadata?: ReporterMetadata;
  assigneeId?: string;
  labels: string[];
  attachments: Attachment[];
  comments: Comment[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReporterMetadata {
  userAgent?: string;
  url?: string;
  timestamp?: string;
  browserInfo?: {
    name?: string;
    version?: string;
    os?: string;
  };
  screenInfo?: {
    width?: number;
    height?: number;
    devicePixelRatio?: number;
  };
  customData?: Record<string, any>;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId?: string;
  authorEmail?: string;
  authorName?: string;
  content: string;
  isInternal: boolean; // Only visible to team members
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueInput {
  projectId: string;
  title: string;
  description: string;
  priority?: IssuePriority;
  category?: IssueCategory;
  reporterEmail: string;
  reporterMetadata?: ReporterMetadata;
  labels?: string[];
  attachments?: File[];
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: IssueCategory;
  assigneeId?: string;
  labels?: string[];
}

export interface IssueFilters {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  category?: IssueCategory[];
  assigneeId?: string;
  reporterEmail?: string;
  labels?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface IssuePagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface IssueConnection {
  issues: Issue[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}
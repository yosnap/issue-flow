/**
 * @fileoverview IssueList Component
 * 
 * Administrative component for viewing and managing issues.
 * Includes filtering, sorting, and premium analytics features.
 */

import React, { useMemo, useState, useCallback } from 'react';
import type { Issue, IssueFilters } from '../types';
import { useIssueList } from '../hooks/useIssueList';

export interface IssueListProps {
  // Filtering
  initialFilters?: IssueFilters;
  
  // Display options
  pageSize?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showStats?: boolean;
  
  // Event handlers
  onIssueClick?: (issue: Issue) => void;
  onStatusChange?: (issue: Issue, newStatus: string) => void;
  onPriorityChange?: (issue: Issue, newPriority: string) => void;
  
  // Premium features
  enableExport?: boolean;
  enableBulkActions?: boolean;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export function IssueList({
  initialFilters = {},
  pageSize = 20,
  showFilters = true,
  showSearch = true,
  showStats = true,
  onIssueClick,
  onStatusChange,
  onPriorityChange,
  enableExport = false,
  enableBulkActions = false,
  className,
  style,
}: IssueListProps) {
  const {
    issues,
    loading,
    error,
    hasMore,
    isEmpty,
    stats,
    fetchMore,
    refreshIssues,
    updateIssue,
    deleteIssue,
    filters,
    setFilters,
    clearFilters,
  } = useIssueList({
    initialFilters,
    pageSize,
    autoFetch: true,
  });
  
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  
  // Status options
  const statusOptions = [
    { value: 'open', label: '🔓 Open', color: '#10b981' },
    { value: 'in_progress', label: '🔄 In Progress', color: '#f59e0b' },
    { value: 'resolved', label: '✅ Resolved', color: '#6366f1' },
    { value: 'closed', label: '🔒 Closed', color: '#6b7280' },
  ];
  
  const priorityOptions = [
    { value: 'low', label: '🟢 Low', color: '#10b981' },
    { value: 'medium', label: '🟡 Medium', color: '#f59e0b' },
    { value: 'high', label: '🟠 High', color: '#f97316' },
    { value: 'critical', label: '🔴 Critical', color: '#ef4444' },
  ];
  
  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((query: string) => {
      setFilters({ search: query || undefined });
    }, 300),
    [setFilters]
  );
  
  // Handle status change
  const handleStatusChange = useCallback(async (issue: Issue, newStatus: string) => {
    try {
      await updateIssue(issue.id, { status: newStatus as any });
      if (onStatusChange) {
        onStatusChange(issue, newStatus);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [updateIssue, onStatusChange]);
  
  // Handle priority change  
  const handlePriorityChange = useCallback(async (issue: Issue, newPriority: string) => {
    try {
      await updateIssue(issue.id, { priority: newPriority as any });
      if (onPriorityChange) {
        onPriorityChange(issue, newPriority);
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  }, [updateIssue, onPriorityChange]);
  
  // Handle bulk actions
  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    const promises = Array.from(selectedIssues).map(issueId => {
      const issue = issues.find(i => i.id === issueId);
      if (issue) {
        return updateIssue(issueId, { status: newStatus as any });
      }
      return Promise.resolve();
    });
    
    try {
      await Promise.all(promises);
      setSelectedIssues(new Set());
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  }, [selectedIssues, issues, updateIssue]);
  
  // Handle selection
  const toggleSelection = useCallback((issueId: string) => {
    setSelectedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedIssues(new Set(issues.map(issue => issue.id)));
  }, [issues]);
  
  const clearSelection = useCallback(() => {
    setSelectedIssues(new Set());
  }, []);
  
  // Export functionality (Premium)
  const handleExport = useCallback(() => {
    if (!enableExport) return;
    
    const csvContent = [
      ['ID', 'Title', 'Status', 'Priority', 'Category', 'Created', 'Reporter'].join(','),
      ...issues.map(issue => [
        issue.id,
        `"${issue.title.replace(/"/g, '""')}"`,
        issue.status,
        issue.priority,
        issue.category,
        new Date(issue.createdAt).toISOString(),
        issue.reporter.email
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [enableExport, issues]);
  
  // Format date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);
  
  // Get status info
  const getStatusInfo = useCallback((status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  }, [statusOptions]);
  
  // Get priority info
  const getPriorityInfo = useCallback((priority: string) => {
    return priorityOptions.find(opt => opt.value === priority) || priorityOptions[1];
  }, [priorityOptions]);
  
  // Styles
  const containerStyles: React.CSSProperties = {
    fontFamily: 'var(--if-font-family, inherit)',
    fontSize: 'var(--if-font-size, 14px)',
    ...style,
  };
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: 'var(--if-background, #ffffff)',
    borderRadius: 'var(--if-border-radius, 8px)',
    border: '1px solid var(--if-border, #e5e7eb)',
  };
  
  const statsStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  };
  
  const statCardStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: 'var(--if-background, #ffffff)',
    borderRadius: 'var(--if-border-radius, 6px)',
    border: '1px solid var(--if-border, #e5e7eb)',
    textAlign: 'center' as const,
  };
  
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'var(--if-background, #ffffff)',
    borderRadius: 'var(--if-border-radius, 8px)',
    border: '1px solid var(--if-border, #e5e7eb)',
    overflow: 'hidden',
  };
  
  const thStyles: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left' as const,
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid var(--if-border, #e5e7eb)',
    fontWeight: '500',
  };
  
  const tdStyles: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid var(--if-border, #e5e7eb)',
    verticalAlign: 'top',
  };
  
  return (
    <div className={className} style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
            Issues ({stats.total})
          </h2>
          <p style={{ margin: 0, color: 'var(--if-text, #6b7280)', fontSize: '14px' }}>
            Manage and track all reported issues
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {enableExport && (
            <button
              onClick={handleExport}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--if-primary, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--if-border-radius, 6px)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              📊 Export
            </button>
          )}
          
          <button
            onClick={refreshIssues}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: 'var(--if-primary, #3b82f6)',
              border: '1px solid var(--if-primary, #3b82f6)',
              borderRadius: 'var(--if-border-radius, 6px)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '🔄' : '🔄'} Refresh
          </button>
        </div>
      </div>
      
      {/* Stats */}
      {showStats && (
        <div style={statsStyles}>
          <div style={statCardStyles}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
              {stats.byStatus.open || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)' }}>Open</div>
          </div>
          
          <div style={statCardStyles}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
              {stats.byStatus.in_progress || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)' }}>In Progress</div>
          </div>
          
          <div style={statCardStyles}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#6366f1' }}>
              {stats.byStatus.resolved || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)' }}>Resolved</div>
          </div>
          
          <div style={statCardStyles}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>
              {stats.byPriority.critical || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)' }}>Critical</div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: 'var(--if-background, #ffffff)',
          borderRadius: 'var(--if-border-radius, 8px)',
          border: '1px solid var(--if-border, #e5e7eb)',
        }}>
          {showSearch && (
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--if-border, #d1d5db)',
                borderRadius: 'var(--if-border-radius, 6px)',
                fontSize: '14px',
                marginBottom: showFilters ? '12px' : '0',
              }}
            />
          )}
          
          {showFilters && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              <select
                value={filters.status?.[0] || ''}
                onChange={(e) => setFilters({ status: e.target.value ? [e.target.value as any] : undefined })}
                style={{
                  padding: '6px 8px',
                  border: '1px solid var(--if-border, #d1d5db)',
                  borderRadius: 'var(--if-border-radius, 4px)',
                  fontSize: '12px',
                }}
              >
                <option value="">All Statuses</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <select
                value={filters.priority?.[0] || ''}
                onChange={(e) => setFilters({ priority: e.target.value ? [e.target.value as any] : undefined })}
                style={{
                  padding: '6px 8px',
                  border: '1px solid var(--if-border, #d1d5db)',
                  borderRadius: 'var(--if-border-radius, 4px)',
                  fontSize: '12px',
                }}
              >
                <option value="">All Priorities</option>
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  color: 'var(--if-text, #6b7280)',
                  border: '1px solid var(--if-border, #d1d5db)',
                  borderRadius: 'var(--if-border-radius, 4px)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Bulk Actions */}
      {enableBulkActions && selectedIssues.size > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--if-border-radius, 6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '14px' }}>
            {selectedIssues.size} issue{selectedIssues.size !== 1 ? 's' : ''} selected
          </span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: status.color,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {status.label}
              </button>
            ))}
            
            <button
              onClick={clearSelection}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                color: 'var(--if-text, #6b7280)',
                border: '1px solid var(--if-border, #d1d5db)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--if-border-radius, 6px)',
          color: 'var(--if-error, #dc2626)',
        }}>
          {error}
        </div>
      )}
      
      {/* Issues Table */}
      {!loading && !isEmpty && (
        <table style={tableStyles}>
          <thead>
            <tr>
              {enableBulkActions && (
                <th style={thStyles}>
                  <input
                    type="checkbox"
                    checked={selectedIssues.size === issues.length && issues.length > 0}
                    onChange={() => {
                      if (selectedIssues.size === issues.length) {
                        clearSelection();
                      } else {
                        selectAll();
                      }
                    }}
                  />
                </th>
              )}
              <th style={thStyles}>Issue</th>
              <th style={thStyles}>Status</th>
              <th style={thStyles}>Priority</th>
              <th style={thStyles}>Reporter</th>
              <th style={thStyles}>Created</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => {
              const statusInfo = getStatusInfo(issue.status);
              const priorityInfo = getPriorityInfo(issue.priority);
              
              return (
                <tr key={issue.id} style={{ cursor: onIssueClick ? 'pointer' : 'default' }}>
                  {enableBulkActions && (
                    <td style={tdStyles}>
                      <input
                        type="checkbox"
                        checked={selectedIssues.has(issue.id)}
                        onChange={() => toggleSelection(issue.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  
                  <td style={tdStyles} onClick={() => onIssueClick?.(issue)}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {issue.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--if-text, #6b7280)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      maxWidth: '300px',
                    }}>
                      {issue.description}
                    </div>
                  </td>
                  
                  <td style={tdStyles}>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 6px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: statusInfo.color,
                        color: '#ffffff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  <td style={tdStyles}>
                    <select
                      value={issue.priority}
                      onChange={(e) => handlePriorityChange(issue, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 6px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: priorityInfo.color,
                        color: '#ffffff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {priorityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  <td style={tdStyles}>
                    <div style={{ fontSize: '14px' }}>{issue.reporter.email}</div>
                  </td>
                  
                  <td style={tdStyles}>
                    <div style={{ fontSize: '12px', color: 'var(--if-text, #6b7280)' }}>
                      {formatDate(issue.createdAt)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      
      {/* Empty state */}
      {!loading && isEmpty && (
        <div style={{
          padding: '40px',
          textAlign: 'center' as const,
          backgroundColor: 'var(--if-background, #ffffff)',
          borderRadius: 'var(--if-border-radius, 8px)',
          border: '1px solid var(--if-border, #e5e7eb)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No issues found</h3>
          <p style={{ margin: 0, color: 'var(--if-text, #6b7280)' }}>
            {Object.keys(filters).length > 0 
              ? 'Try adjusting your filters to see more results.'
              : 'Issues will appear here when users report them.'}
          </p>
        </div>
      )}
      
      {/* Loading more */}
      {hasMore && (
        <div style={{ textAlign: 'center' as const, marginTop: '16px' }}>
          <button
            onClick={fetchMore}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--if-primary, #3b82f6)',
              border: '1px solid var(--if-primary, #3b82f6)',
              borderRadius: 'var(--if-border-radius, 6px)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}
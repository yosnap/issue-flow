/**
 * @fileoverview useIssueList Hook
 * 
 * Hook for managing lists of issues with filtering, pagination, and CRUD operations.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Issue, IssueFilters, UseIssueListReturn } from '../types';
import { useIssueFlowContext } from './useIssueFlowContext';

export interface UseIssueListOptions {
  // Initial filters
  initialFilters?: IssueFilters;
  
  // Pagination
  pageSize?: number;
  
  // Auto-fetch on mount
  autoFetch?: boolean;
  
  // Real-time updates
  realTime?: boolean;
  
  // Polling interval (ms)
  pollInterval?: number;
  
  // Debug mode
  debug?: boolean;
}

export function useIssueList(options: UseIssueListOptions = {}): UseIssueListReturn {
  const context = useIssueFlowContext();
  const {
    initialFilters = {},
    pageSize = 20,
    autoFetch = true,
    realTime = false,
    pollInterval = 30000, // 30 seconds
    debug = false
  } = options;
  
  // State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFiltersInternal] = useState<IssueFilters>(initialFilters);
  
  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[IssueFlow:useIssueList]', ...args);
    }
  }, [debug]);
  
  // Computed values
  const isEmpty = issues.length === 0;
  const totalIssues = issues.length;
  
  // Filter helpers
  const setFilters = useCallback((newFilters: Partial<IssueFilters>) => {
    log('Updating filters:', newFilters);
    setFiltersInternal(prev => ({ ...prev, ...newFilters }));
    setPage(0); // Reset pagination
    setIssues([]); // Clear current issues
    setHasMore(true);
  }, [log]);
  
  const clearFilters = useCallback(() => {
    log('Clearing filters');
    setFiltersInternal({});
    setPage(0);
    setIssues([]);
    setHasMore(true);
  }, [log]);
  
  // API operations
  const fetchIssues = useCallback(async (reset = true) => {
    if (!context.client) {
      const errorMsg = 'IssueFlow client not initialized';
      log(errorMsg);
      setError(errorMsg);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 0 : page;
      const offset = currentPage * pageSize;
      
      log('Fetching issues:', { filters, offset, limit: pageSize });
      
      // Build query parameters
      const params = {
        ...filters,
        offset,
        limit: pageSize,
      };
      
      const response = await context.client.getIssues(params);
      const newIssues = response.data || [];
      
      log(`Fetched ${newIssues.length} issues`);
      
      if (reset) {
        setIssues(newIssues);
        setPage(1);
      } else {
        setIssues(prev => [...prev, ...newIssues]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more issues
      setHasMore(newIssues.length === pageSize);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch issues';
      log('Fetch failed:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [context.client, filters, page, pageSize, log]);
  
  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) {
      log('Cannot fetch more:', { loading, hasMore });
      return;
    }
    
    log('Fetching more issues');
    await fetchIssues(false);
  }, [loading, hasMore, fetchIssues, log]);
  
  const refreshIssues = useCallback(async () => {
    log('Refreshing issues');
    await fetchIssues(true);
  }, [fetchIssues, log]);
  
  // CRUD operations
  const updateIssue = useCallback(async (id: string, updates: Partial<Issue>) => {
    if (!context.client) {
      throw new Error('IssueFlow client not initialized');
    }
    
    log('Updating issue:', id, updates);
    
    try {
      const updatedIssue = await context.client.updateIssue(id, updates);
      
      setIssues(prev => 
        prev.map(issue => 
          issue.id === id ? { ...issue, ...updatedIssue } : issue
        )
      );
      
      log('Issue updated successfully:', updatedIssue);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update issue';
      log('Update failed:', err);
      setError(errorMessage);
      throw err;
    }
  }, [context.client, log]);
  
  const deleteIssue = useCallback(async (id: string) => {
    if (!context.client) {
      throw new Error('IssueFlow client not initialized');
    }
    
    log('Deleting issue:', id);
    
    try {
      await context.client.deleteIssue(id);
      
      setIssues(prev => prev.filter(issue => issue.id !== id));
      
      log('Issue deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete issue';
      log('Delete failed:', err);
      setError(errorMessage);
      throw err;
    }
  }, [context.client, log]);
  
  // Find issue by ID
  const findIssue = useCallback((id: string): Issue | undefined => {
    return issues.find(issue => issue.id === id);
  }, [issues]);
  
  // Filter issues locally (in addition to server-side filtering)
  const filteredIssues = useMemo(() => {
    let filtered = issues;
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(search) ||
        issue.description.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [issues, filters.search]);
  
  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && context.isInitialized) {
      log('Auto-fetching issues on mount');
      fetchIssues(true);
    }
  }, [autoFetch, context.isInitialized, fetchIssues, log]);
  
  // Refetch when filters change
  useEffect(() => {
    if (context.isInitialized) {
      log('Refetching due to filter change');
      fetchIssues(true);
    }
  }, [filters, context.isInitialized, fetchIssues, log]);
  
  // Real-time updates effect
  useEffect(() => {
    if (!realTime || !context.client) return;
    
    let intervalId: NodeJS.Timeout;
    
    if (pollInterval > 0) {
      log('Setting up polling for real-time updates');
      intervalId = setInterval(() => {
        if (!loading) {
          log('Polling for updates');
          refreshIssues();
        }
      }, pollInterval);
    }
    
    return () => {
      if (intervalId) {
        log('Cleaning up polling');
        clearInterval(intervalId);
      }
    };
  }, [realTime, pollInterval, context.client, loading, refreshIssues, log]);
  
  // Statistics
  const stats = useMemo(() => {
    const statusCounts = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const priorityCounts = issues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: totalIssues,
      byStatus: statusCounts,
      byPriority: priorityCounts,
    };
  }, [issues, totalIssues]);
  
  return {
    // Data
    issues: filteredIssues,
    loading,
    error,
    hasMore,
    isEmpty,
    stats,
    
    // Actions
    fetchIssues: () => fetchIssues(true),
    fetchMore,
    refreshIssues,
    updateIssue,
    deleteIssue,
    findIssue,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
  };
}
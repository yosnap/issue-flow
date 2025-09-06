/**
 * @fileoverview IssueFlow API Client
 * 
 * HTTP client for interacting with the IssueFlow API.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { IssueFlowConfig, CreateIssueRequest, Issue, IssueStatus } from '../types';

/**
 * Main IssueFlow API Client
 */
export class IssueFlowClient {
  private axios: AxiosInstance;
  private config: IssueFlowConfig;

  constructor(config: IssueFlowConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `IssueFlow-SDK/0.2.0`,
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        ...(config.projectId && { 'X-Project-ID': config.projectId }),
      },
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid API key or project ID');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw error;
      }
    );
  }

  /**
   * Create a new issue
   */
  async createIssue(issue: CreateIssueRequest): Promise<Issue> {
    const response = await this.axios.post('/api/v1/issues', issue);
    return response.data;
  }

  /**
   * Get an issue by ID
   */
  async getIssue(id: string): Promise<Issue> {
    const response = await this.axios.get(`/api/v1/issues/${id}`);
    return response.data;
  }

  /**
   * List issues with pagination
   */
  async listIssues(options: {
    page?: number;
    limit?: number;
    status?: IssueStatus;
    search?: string;
  } = {}): Promise<{ issues: Issue[]; total: number; page: number; pages: number }> {
    const response = await this.axios.get('/api/v1/issues', { params: options });
    return response.data;
  }

  /**
   * Update an issue
   */
  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue> {
    const response = await this.axios.put(`/api/v1/issues/${id}`, updates);
    return response.data;
  }

  /**
   * Delete an issue
   */
  async deleteIssue(id: string): Promise<void> {
    await this.axios.delete(`/api/v1/issues/${id}`);
  }

  /**
   * Upload an attachment
   */
  async uploadAttachment(file: File | Buffer, filename?: string): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file, filename);
    
    const response = await this.axios.post('/api/v1/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    const response = await this.axios.get('/api/v1/health');
    return response.data;
  }
}

export default IssueFlowClient;
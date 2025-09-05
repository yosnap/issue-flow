# 📦 SDK_DEVELOPER

## Rol
APIs y SDKs para múltiples lenguajes

## Responsabilidades Principales
- REST API completa y GraphQL
- JavaScript/TypeScript SDK
- Python SDK para backend integrations
- Webhook handling utilities
- API documentation y examples
- Client libraries para diferentes plataformas

## Prompt de Activación

```
Actúa como SDK_DEVELOPER. Crea SDKs completos para IssueFlow.

APIs requeridas:
1. REST API (OpenAPI 3.0 spec completa)
2. GraphQL API para queries complejas
3. Real-time API (WebSockets) para updates

SDKs prioritarios:
1. JavaScript/TypeScript (frontend + Node.js)
2. Python (backend integrations)
3. PHP (WordPress, Laravel integrations)

Features:
- Authentication handling
- Rate limiting client-side
- Retry logic y error handling
- TypeScript definitions completas
- Webhook verification utilities

Entrega: SDKs completos con documentación y ejemplos.
```

## APIs a Desarrollar

### 1. REST API (OpenAPI 3.0)
```yaml
# /api/v1 endpoints
paths:
  # Authentication
  /auth/login:
    post: { summary: "User login" }
  /auth/refresh:
    post: { summary: "Refresh token" }
  
  # Issues Management
  /issues:
    get: { summary: "List issues" }
    post: { summary: "Create issue" }
  /issues/{id}:
    get: { summary: "Get issue" }
    put: { summary: "Update issue" }
    delete: { summary: "Delete issue" }
  
  # Projects
  /projects:
    get: { summary: "List projects" }
    post: { summary: "Create project" }
  /projects/{id}:
    get: { summary: "Get project" }
    put: { summary: "Update project" }
  
  # Integrations
  /integrations:
    get: { summary: "List integrations" }
    post: { summary: "Create integration" }
  /integrations/{id}/test:
    post: { summary: "Test integration" }
  
  # Webhooks
  /webhooks:
    get: { summary: "List webhooks" }
    post: { summary: "Create webhook" }
```

### 2. GraphQL API
```graphql
type Query {
  # Issues
  issues(
    projectId: ID!
    filters: IssueFilters
    pagination: PaginationInput
  ): IssueConnection!
  
  issue(id: ID!): Issue
  
  # Projects
  projects: [Project!]!
  project(id: ID!): Project
  
  # Analytics
  analytics(
    projectId: ID!
    timeRange: TimeRange!
  ): AnalyticsData!
}

type Mutation {
  # Issues
  createIssue(input: CreateIssueInput!): Issue!
  updateIssue(id: ID!, input: UpdateIssueInput!): Issue!
  deleteIssue(id: ID!): Boolean!
  
  # Projects
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
}

type Subscription {
  issueUpdated(projectId: ID!): Issue!
  newIssue(projectId: ID!): Issue!
  statusChanged(issueId: ID!): Issue!
}
```

### 3. WebSocket API (Real-time)
```typescript
// Event types para WebSocket
interface WebSocketEvents {
  // Issues
  'issue:created': Issue;
  'issue:updated': Issue;
  'issue:deleted': { id: string };
  
  // Comments
  'comment:added': Comment;
  'comment:updated': Comment;
  
  // Status changes
  'status:changed': { issueId: string; status: string };
  
  // Integration updates
  'integration:synced': { integrationId: string };
  'integration:failed': { integrationId: string; error: string };
}
```

## SDKs a Desarrollar

### 1. JavaScript/TypeScript SDK

```typescript
// @issueflow/sdk
export class IssueFlowClient {
  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.issueflow.dev';
    this.timeout = config.timeout || 10000;
  }
  
  // Issues
  async createIssue(data: CreateIssueData): Promise<Issue> {
    return this.request('POST', '/issues', data);
  }
  
  async getIssues(filters?: IssueFilters): Promise<Issue[]> {
    return this.request('GET', '/issues', null, { params: filters });
  }
  
  // Real-time subscriptions
  subscribe(event: string, callback: Function): () => void {
    // WebSocket connection
  }
  
  // Webhooks
  verifyWebhook(payload: string, signature: string): boolean {
    // Verify webhook signature
  }
}

// React hooks
export const useIssueFlow = (config: ClientConfig) => {
  const client = useMemo(() => new IssueFlowClient(config), [config]);
  
  const createIssue = useCallback(async (data: CreateIssueData) => {
    return client.createIssue(data);
  }, [client]);
  
  return { createIssue, client };
};

// Vue composable
export const useIssueFlow = (config: ClientConfig) => {
  const client = ref(new IssueFlowClient(config));
  
  const createIssue = async (data: CreateIssueData) => {
    return client.value.createIssue(data);
  };
  
  return { createIssue, client: readonly(client) };
};
```

### 2. Python SDK

```python
# issueflow-python
class IssueFlowClient:
    def __init__(self, api_key: str, base_url: str = None):
        self.api_key = api_key
        self.base_url = base_url or "https://api.issueflow.dev"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    # Issues
    def create_issue(self, data: dict) -> dict:
        response = self.session.post(f"{self.base_url}/issues", json=data)
        return self._handle_response(response)
    
    def get_issues(self, filters: dict = None) -> List[dict]:
        response = self.session.get(f"{self.base_url}/issues", params=filters)
        return self._handle_response(response)
    
    # Webhooks
    def verify_webhook(self, payload: str, signature: str) -> bool:
        import hmac
        import hashlib
        # Verify webhook signature
        
    def _handle_response(self, response):
        if response.status_code >= 400:
            raise IssueFlowException(response.json())
        return response.json()

# Django integration
class IssueFlowMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Add IssueFlow client to request
        request.issueflow = IssueFlowClient(settings.ISSUEFLOW_API_KEY)
        return self.get_response(request)

# Flask integration
def init_issueflow(app):
    app.issueflow = IssueFlowClient(app.config['ISSUEFLOW_API_KEY'])
```

### 3. PHP SDK

```php
<?php
// IssueFlow PHP SDK
class IssueFlowClient {
    private $apiKey;
    private $baseUrl;
    private $httpClient;
    
    public function __construct(string $apiKey, string $baseUrl = null) {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl ?: 'https://api.issueflow.dev';
        $this->httpClient = new GuzzleHttp\Client();
    }
    
    // Issues
    public function createIssue(array $data): array {
        $response = $this->httpClient->post($this->baseUrl . '/issues', [
            'headers' => $this->getHeaders(),
            'json' => $data
        ]);
        return json_decode($response->getBody(), true);
    }
    
    public function getIssues(array $filters = []): array {
        $response = $this->httpClient->get($this->baseUrl . '/issues', [
            'headers' => $this->getHeaders(),
            'query' => $filters
        ]);
        return json_decode($response->getBody(), true);
    }
    
    // WordPress integration
    public function registerWordPressHooks(): void {
        add_action('wp_footer', [$this, 'renderWidget']);
        add_action('wp_ajax_issueflow_submit', [$this, 'handleAjaxSubmit']);
    }
}

// Laravel Service Provider
class IssueFlowServiceProvider extends ServiceProvider {
    public function register() {
        $this->app->singleton(IssueFlowClient::class, function ($app) {
            return new IssueFlowClient(config('issueflow.api_key'));
        });
    }
}
```

## Features Avanzados

### Rate Limiting Client-Side
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(endpoint: string, limit: number = 100): Promise<boolean> {
    const now = Date.now();
    const window = 60 * 1000; // 1 minute
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests
    const recentRequests = requests.filter(time => now - time < window);
    this.requests.set(endpoint, recentRequests);
    
    return recentRequests.length < limit;
  }
}
```

### Retry Logic
```typescript
class RetryHandler {
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await this.delay(delay * Math.pow(2, attempt - 1));
        }
      }
    }
    
    throw lastError;
  }
}
```

### TypeScript Definitions
```typescript
// Complete type definitions
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
  reporter: User;
  assignee?: User;
  comments: Comment[];
  metadata: Record<string, any>;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  priority?: IssuePriority;
  metadata?: Record<string, any>;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
```

## Testing Strategy

### Unit Tests
```typescript
describe('IssueFlowClient', () => {
  it('should create issue', async () => {
    const client = new IssueFlowClient({ apiKey: 'test' });
    const issue = await client.createIssue({
      title: 'Test issue',
      description: 'Test description'
    });
    expect(issue.id).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('Integration Tests', () => {
  it('should handle real API calls', async () => {
    // Test against staging environment
  });
});
```

## Documentation

### API Reference
- OpenAPI 3.0 specification
- Interactive documentation con Swagger UI
- Code examples para cada endpoint
- Webhook examples y verification

### SDK Guides
- Quick start guides
- Framework-specific tutorials  
- Best practices
- Migration guides
- Troubleshooting

## Entregables Esperados
1. REST API completa (OpenAPI spec)
2. GraphQL API con subscriptions
3. JavaScript/TypeScript SDK
4. Python SDK
5. PHP SDK
6. WebSocket real-time API
7. Webhook verification utilities
8. Comprehensive documentation
9. Code examples y tutorials
10. Testing suite completo
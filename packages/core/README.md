# @issueflow/core

> IssueFlow core framework with multi-tenant architecture

The core backend service that powers the IssueFlow framework. Built with Fastify, PostgreSQL, and Redis for high performance and scalability.

## 🚀 Features

- **Multi-tenant Architecture**: Isolated data per organization
- **Plugin System**: Extensible architecture with event-driven plugins
- **High Performance**: Built on Fastify with Redis caching
- **Type Safety**: Full TypeScript support with Zod validation
- **Authentication**: JWT + OAuth2 support
- **Queue System**: Background job processing with BullMQ
- **Security**: Rate limiting, CORS, and helmet protection

## 📦 Installation

```bash
npm install @issueflow/core
```

## 🏗️ Quick Start

### Basic Server Setup

```typescript
import { IssueFlowApp } from '@issueflow/core';

const app = new IssueFlowApp({
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    database: 'issueflow',
    username: 'postgres',
    password: 'password'
  },
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Start server
await app.start();
console.log('🚀 IssueFlow server running on http://localhost:3000');
```

### With Plugin System

```typescript
import { IssueFlowApp } from '@issueflow/core';
import { GitHubPlugin } from '@issueflow/core/plugins';

const app = new IssueFlowApp(config);

// Register GitHub integration plugin
await app.pluginRegistry.registerPlugin(new GitHubPlugin(), {
  token: 'github_pat_xxxxx',
  owner: 'your-org',
  repo: 'your-repo'
});

await app.pluginRegistry.activatePlugin('github-integration@1.0.0');
await app.start();
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/issueflow
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=issueflow
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=https://your-domain.com
```

### TypeScript Configuration

```typescript
interface AppConfig {
  port?: number;
  host?: string;
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  jwt?: {
    secret: string;
    expiresIn?: string;
  };
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
  rateLimit?: {
    max: number;
    window: number;
  };
}
```

## 🔌 Plugin System

The core includes a powerful plugin system for extending functionality:

### Creating a Custom Plugin

```typescript
import { BasePlugin, PluginType, IssueCreatedEvent } from '@issueflow/core';

export class CustomPlugin extends BasePlugin {
  readonly name = 'custom-plugin';
  readonly version = '1.0.0';
  readonly type = PluginType.INTEGRATION;

  async onIssueCreated(event: IssueCreatedEvent): Promise<void> {
    // Handle issue creation
    this.log('info', 'New issue created', { 
      issueId: event.data.issue.id 
    });
    
    // Your custom logic here
    await this.sendNotification(event.data.issue);
  }

  private async sendNotification(issue: Issue) {
    // Custom notification logic
  }
}
```

### Built-in Plugins

- **GitHubPlugin**: Sync issues with GitHub repositories
- **SlackPlugin**: Send notifications to Slack channels
- **EmailPlugin**: Email notifications for issue updates

## 📊 API Endpoints

### Issues

```bash
# Create issue
POST /api/v1/issues
Content-Type: application/json

{
  "title": "Bug in login form",
  "description": "Users cannot login with special characters",
  "priority": "high",
  "category": "bug",
  "projectId": "proj_123"
}

# Get issue
GET /api/v1/issues/:id

# List issues
GET /api/v1/issues?page=1&limit=10&status=open

# Update issue
PUT /api/v1/issues/:id

# Delete issue
DELETE /api/v1/issues/:id
```

### Projects

```bash
# Create project
POST /api/v1/projects

# Get project
GET /api/v1/projects/:id

# List projects
GET /api/v1/projects
```

### Authentication

```bash
# Login
POST /api/v1/auth/login

# Register
POST /api/v1/auth/register

# Refresh token
POST /api/v1/auth/refresh
```

## 🧪 Testing

The core package includes comprehensive tests for all functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Plugin Testing

Test your custom plugins using the built-in test runner:

```typescript
// Run plugin system tests
npm run test:plugins
```

## 🏗️ Development

### Project Structure

```
src/
├── app.ts                 # Main application class
├── server.ts             # Fastify server setup
├── database/             # Database models and migrations
├── auth/                 # Authentication middleware
├── routes/               # API route handlers
├── plugins/              # Plugin system
│   ├── PluginRegistry.ts # Plugin management
│   ├── BasePlugin.ts     # Base plugin class
│   └── GitHubPlugin.ts   # GitHub integration
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

### Build Process

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Setup

```bash
# Production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-production-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

MIT © [Paulo Sánchez](https://github.com/yosnap)

## 🆘 Support

- 📖 [Documentation](https://docs.issueflow.com)
- 🐛 [Issue Tracker](https://github.com/yosnap/issueflow/issues)
- 💬 [Discussions](https://github.com/yosnap/issueflow/discussions)
- 📧 Email: yosnap@gmail.com

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
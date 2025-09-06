# @issueflow/cli

> Command line interface for IssueFlow project management

Powerful CLI tool to scaffold, configure, and manage IssueFlow projects. Create new projects, add framework adapters, manage plugins, and deploy with a single command.

## 🚀 Features

- **Project Scaffolding**: Generate new IssueFlow projects
- **Framework Integration**: Add React, Vue, Next.js, Nuxt, and more
- **Plugin Management**: Install and configure plugins
- **Configuration**: Interactive setup wizard
- **Deployment**: Deploy to various platforms
- **Development Tools**: Dev server, testing, and building
- **Templates**: Pre-configured project templates

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @issueflow/cli
# or
yarn global add @issueflow/cli
# or
pnpm add -g @issueflow/cli
```

### Usage with npx

```bash
npx @issueflow/cli create my-project
```

## 🏗️ Quick Start

### Create New Project

```bash
# Interactive project creation
issueflow create my-project

# With template
issueflow create my-project --template react

# With configuration
issueflow create my-project --framework react --typescript
```

### Add Framework Adapter

```bash
# Navigate to your project
cd my-project

# Add React adapter
issueflow add react

# Add Vue adapter
issueflow add vue

# Add Next.js adapter  
issueflow add nextjs
```

## 📋 Commands

### Project Creation

```bash
# Create new project
issueflow create <project-name> [options]

Options:
  --template, -t     Project template (react, vue, nextjs, nuxt)
  --typescript       Use TypeScript
  --framework, -f    Framework adapter
  --no-git          Skip git initialization
  --no-install      Skip package installation
  --package-manager  Package manager (npm, yarn, pnpm)
```

### Framework Management

```bash
# Add framework adapter
issueflow add <framework> [options]

# Remove framework adapter
issueflow remove <framework>

# List available frameworks
issueflow list frameworks

# List installed adapters
issueflow list installed
```

### Plugin Management

```bash
# Install plugin
issueflow plugin install <plugin-name>

# Configure plugin
issueflow plugin config <plugin-name>

# List available plugins
issueflow plugin list

# Remove plugin
issueflow plugin remove <plugin-name>
```

### Configuration

```bash
# Interactive configuration
issueflow config

# Set configuration value
issueflow config set <key> <value>

# Get configuration value
issueflow config get <key>

# Show current configuration
issueflow config show
```

### Development

```bash
# Start development server
issueflow dev

# Build project
issueflow build

# Run tests
issueflow test

# Lint code
issueflow lint
```

### Deployment

```bash
# Deploy to platform
issueflow deploy [platform]

# Platforms: vercel, netlify, railway, heroku
issueflow deploy vercel
issueflow deploy netlify --prod

# Show deployment status
issueflow deployment status
```

## 🎨 Project Templates

### React Template

```bash
issueflow create my-react-app --template react
```

Includes:
- React 18 with TypeScript
- IssueFlow React adapter pre-configured
- Tailwind CSS for styling
- Vite for development and building
- ESLint and Prettier
- GitHub Actions CI/CD

### Vue Template

```bash
issueflow create my-vue-app --template vue
```

Includes:
- Vue 3 with Composition API
- IssueFlow Vue adapter pre-configured
- Pinia for state management
- Vue Router for navigation
- Vite + TypeScript
- Auto-import support

### Next.js Template

```bash
issueflow create my-nextjs-app --template nextjs
```

Includes:
- Next.js 14 with App Router
- IssueFlow React adapter
- TypeScript and Tailwind CSS
- Prisma for database
- NextAuth.js for authentication
- Vercel deployment ready

### Full-Stack Template

```bash
issueflow create my-fullstack-app --template fullstack
```

Includes:
- IssueFlow Core backend
- React frontend with adapters
- PostgreSQL database
- Redis for caching
- Docker configuration
- Kubernetes manifests

## ⚙️ Configuration

### Project Configuration

The CLI creates an `issueflow.config.js` file:

```javascript
// issueflow.config.js
export default {
  // Core configuration
  core: {
    port: 3000,
    database: {
      url: process.env.DATABASE_URL,
      host: 'localhost',
      port: 5432,
      database: 'issueflow',
      username: 'postgres',
      password: 'password'
    },
    redis: {
      url: process.env.REDIS_URL,
      host: 'localhost',
      port: 6379
    }
  },

  // Framework adapters
  adapters: {
    react: {
      path: './apps/web',
      apiUrl: 'http://localhost:3000',
      projectId: 'your-project-id'
    }
  },

  // Plugins
  plugins: [
    {
      name: 'github-integration',
      config: {
        token: process.env.GITHUB_TOKEN,
        owner: 'your-org',
        repo: 'your-repo'
      }
    }
  ],

  // Deployment
  deployment: {
    platform: 'vercel',
    environment: {
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL
    }
  }
};
```

### Global Configuration

```bash
# Set global defaults
issueflow config set defaults.framework react
issueflow config set defaults.typescript true
issueflow config set defaults.packageManager pnpm

# API configuration
issueflow config set api.baseUrl https://api.issueflow.com
issueflow config set api.key your-api-key
```

## 🔌 Available Adapters

### Frontend Frameworks

```bash
# React
issueflow add react
issueflow add react --typescript --router --state-manager zustand

# Vue.js
issueflow add vue
issueflow add vue --typescript --router --state-manager pinia

# Svelte
issueflow add svelte
issueflow add svelte --typescript --kit

# Angular
issueflow add angular
issueflow add angular --standalone --routing
```

### Meta Frameworks

```bash
# Next.js
issueflow add nextjs
issueflow add nextjs --app-router --typescript

# Nuxt
issueflow add nuxt
issueflow add nuxt --typescript --ssr

# SvelteKit
issueflow add sveltekit
issueflow add sveltekit --typescript --adapter-auto
```

### Backend & Full-Stack

```bash
# Add IssueFlow Core
issueflow add core
issueflow add core --database postgres --redis

# Add Dashboard
issueflow add dashboard
issueflow add dashboard --admin --analytics
```

## 🧩 Plugin Ecosystem

### Official Plugins

```bash
# GitHub Integration
issueflow plugin install github
issueflow plugin config github --token YOUR_TOKEN

# Slack Notifications  
issueflow plugin install slack
issueflow plugin config slack --webhook YOUR_WEBHOOK

# Email Notifications
issueflow plugin install email
issueflow plugin config email --provider sendgrid

# Jira Integration
issueflow plugin install jira
```

### Community Plugins

```bash
# Discord Integration
issueflow plugin install @community/discord

# Linear Integration  
issueflow plugin install @community/linear

# Notion Integration
issueflow plugin install @community/notion
```

## 📁 Project Structure

When you create a project, the CLI generates this structure:

```
my-issueflow-project/
├── apps/
│   ├── api/                 # IssueFlow Core API
│   ├── web/                 # Frontend application
│   └── dashboard/           # Admin dashboard
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   └── config/              # Shared configuration
├── tools/
│   ├── eslint-config/       # ESLint configuration
│   └── tsconfig/            # TypeScript configuration
├── docker-compose.yml       # Development services
├── issueflow.config.js      # IssueFlow configuration
├── package.json            # Root package.json
└── turbo.json              # Turbo configuration
```

## 🚀 Deployment

### Vercel

```bash
issueflow deploy vercel

# With configuration
issueflow deploy vercel --prod --env-file .env.production
```

### Netlify

```bash
issueflow deploy netlify

# Build command and publish directory auto-detected
issueflow deploy netlify --site-name my-issueflow-app
```

### Railway

```bash
issueflow deploy railway

# Full-stack deployment with database
issueflow deploy railway --with-database --with-redis
```

### Self-Hosted

```bash
# Generate Docker configuration
issueflow generate docker

# Generate Kubernetes manifests
issueflow generate k8s

# Generate docker-compose
issueflow generate docker-compose
```

## 🧪 Development Workflow

### Start Development

```bash
# Start all services
issueflow dev

# Start specific service
issueflow dev --service api
issueflow dev --service web

# Watch mode with hot reload
issueflow dev --watch
```

### Testing

```bash
# Run all tests
issueflow test

# Run tests for specific package
issueflow test --package core
issueflow test --package react

# Watch mode
issueflow test --watch

# Coverage report
issueflow test --coverage
```

### Building

```bash
# Build all packages
issueflow build

# Build specific package
issueflow build --package web

# Production build
issueflow build --prod
```

## 📊 Monitoring & Analytics

### Project Status

```bash
# Show project overview
issueflow status

# Show detailed health check
issueflow health

# Show deployment status
issueflow deployment status
```

### Analytics

```bash
# Show usage statistics
issueflow analytics

# Show error rates
issueflow analytics errors

# Show performance metrics
issueflow analytics performance
```

## 🔧 Advanced Usage

### Custom Templates

Create custom project templates:

```bash
# Create template from current project
issueflow template create my-template --from-current

# Use custom template
issueflow create new-project --template my-template
```

### Scripting

Use in CI/CD pipelines:

```bash
#!/bin/bash
# deploy.sh

# Build and test
issueflow build --prod
issueflow test

# Deploy to staging
issueflow deploy vercel --env staging

# Run smoke tests
issueflow test --smoke

# Deploy to production
issueflow deploy vercel --env production
```

### Environment Management

```bash
# Manage environment variables
issueflow env set DATABASE_URL postgres://...
issueflow env get DATABASE_URL
issueflow env list

# Environment-specific configuration
issueflow config --env production
issueflow config --env staging
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

- 📖 [Documentation](https://docs.issueflow.com/cli)
- 🎬 [Video Tutorials](https://youtube.com/issueflow)
- 🐛 [Issue Tracker](https://github.com/yosnap/issueflow/issues)
- 💬 [Discussions](https://github.com/yosnap/issueflow/discussions)
- 📧 Email: yosnap@gmail.com

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
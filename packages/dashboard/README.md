# @issueflow/dashboard

> Administrative dashboard for IssueFlow project management

Comprehensive web-based dashboard for managing IssueFlow projects, issues, users, and analytics. Built with React and modern web technologies.

## 🚀 Features

- **Issue Management**: View, filter, and manage all issues
- **Project Dashboard**: Project-specific analytics and metrics
- **User Management**: Team member permissions and roles
- **Plugin Configuration**: Visual plugin setup and management
- **Analytics & Reports**: Detailed insights and performance metrics
- **Real-time Updates**: Live issue updates and notifications
- **Responsive Design**: Mobile-first responsive interface

## 📦 Installation

```bash
npm install @issueflow/dashboard
```

## 🏗️ Quick Start

### Standalone Dashboard

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Integration with Core

```typescript
import { IssueFlowApp } from '@issueflow/core';
import { dashboardPlugin } from '@issueflow/dashboard';

const app = new IssueFlowApp(config);

// Add dashboard routes
app.register(dashboardPlugin, {
  prefix: '/admin',
  auth: true
});

await app.start();
// Dashboard available at http://localhost:3000/admin
```

## ⚙️ Configuration

### Environment Variables

```bash
# Dashboard Configuration
DASHBOARD_PORT=3001
DASHBOARD_HOST=0.0.0.0

# API Configuration
ISSUEFLOW_API_URL=http://localhost:3000
ISSUEFLOW_API_KEY=your-api-key

# Authentication
AUTH_SECRET=your-auth-secret
AUTH_PROVIDER=local # local, oauth2, saml

# Database (if running standalone)
DATABASE_URL=postgresql://user:pass@localhost:5432/issueflow

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_PROVIDER=mixpanel # mixpanel, amplitude, ga4
```

### Dashboard Config

```typescript
// dashboard.config.js
export default {
  // API Configuration
  api: {
    baseURL: process.env.ISSUEFLOW_API_URL,
    apiKey: process.env.ISSUEFLOW_API_KEY
  },

  // Authentication
  auth: {
    provider: 'local',
    secret: process.env.AUTH_SECRET,
    session: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // UI Configuration
  ui: {
    title: 'IssueFlow Dashboard',
    logo: '/logo.svg',
    theme: 'auto',
    primaryColor: '#2563eb',
    sidebar: {
      collapsed: false,
      items: [
        { id: 'overview', label: 'Overview', icon: 'home' },
        { id: 'issues', label: 'Issues', icon: 'bug' },
        { id: 'projects', label: 'Projects', icon: 'folder' },
        { id: 'users', label: 'Users', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
      ]
    }
  },

  // Features
  features: {
    analytics: true,
    realTimeUpdates: true,
    notifications: true,
    darkMode: true,
    exportData: true
  }
};
```

## 🎛️ Dashboard Sections

### Overview

- Project statistics and KPIs
- Recent issues and activities
- System health monitoring
- Quick actions panel

### Issues Management

```typescript
// Custom issue filters
const filters = {
  status: ['open', 'in_progress'],
  priority: ['high', 'critical'],
  assignee: 'current-user',
  project: 'project-id',
  dateRange: {
    from: '2024-01-01',
    to: '2024-12-31'
  }
};

// Bulk actions
const bulkActions = [
  'assign',
  'changeStatus',
  'addLabels',
  'export',
  'delete'
];
```

### Analytics

- Issue resolution metrics
- User engagement statistics
- Performance monitoring
- Custom reports and dashboards

### Settings

- Project configuration
- Plugin management
- User permissions
- System preferences

## 🔧 Customization

### Custom Components

```tsx
// Custom issue list component
import { IssueList } from '@issueflow/dashboard';

function CustomIssueList() {
  return (
    <IssueList
      columns={['title', 'status', 'priority', 'assignee', 'updated']}
      filters={customFilters}
      actions={customActions}
      onIssueClick={handleIssueClick}
      renderCustomCell={(issue, column) => {
        if (column === 'priority') {
          return <PriorityBadge priority={issue.priority} />;
        }
        return null;
      }}
    />
  );
}
```

### Custom Theme

```css
/* custom-theme.css */
:root {
  --dashboard-primary: #your-brand-color;
  --dashboard-sidebar-bg: #1a1a1a;
  --dashboard-content-bg: #ffffff;
  --dashboard-border-radius: 8px;
  --dashboard-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-layout {
  font-family: 'Your Custom Font', sans-serif;
}
```

## 📊 API Integration

### Custom Data Sources

```typescript
// Custom data provider
import { DataProvider } from '@issueflow/dashboard';

class CustomDataProvider extends DataProvider {
  async getIssues(filters) {
    const response = await fetch('/api/custom/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters })
    });
    
    return response.json();
  }

  async getAnalytics(period) {
    // Custom analytics implementation
    return {
      totalIssues: 150,
      resolvedIssues: 120,
      averageResolutionTime: '2.5 days',
      // ... more metrics
    };
  }
}

// Use custom provider
const dashboard = new Dashboard({
  dataProvider: new CustomDataProvider()
});
```

## 🧪 Testing

### Component Testing

```jsx
import { render, screen } from '@testing-library/react';
import { DashboardProvider } from '@issueflow/dashboard/testing';
import { IssueList } from '@issueflow/dashboard';

test('renders issue list', () => {
  render(
    <DashboardProvider mockData={{ issues: mockIssues }}>
      <IssueList />
    </DashboardProvider>
  );
  
  expect(screen.getByText('Issues')).toBeInTheDocument();
  expect(screen.getByText('Bug in login form')).toBeInTheDocument();
});
```

## 🚀 Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3001

CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production deployment
NODE_ENV=production
DASHBOARD_PORT=3001
ISSUEFLOW_API_URL=https://api.your-domain.com
```

## 📝 License

MIT © [Paulo Sánchez](https://github.com/yosnap)

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
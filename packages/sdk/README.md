# @issueflow/sdk

> JavaScript/TypeScript SDK for IssueFlow API

Universal SDK for interacting with the IssueFlow API. Works in both browser and Node.js environments with full TypeScript support.

## 🚀 Features

- **Universal**: Works in browser and Node.js
- **Type Safety**: Full TypeScript support with Zod validation
- **HTTP Client**: Built on Axios with automatic retries
- **Webhook Support**: Secure webhook handling utilities
- **Form Utilities**: Helper functions for forms and validation
- **Widget Integration**: Easy embedding in web applications
- **File Upload**: Support for attachments and screenshots
- **Error Handling**: Comprehensive error management

## 📦 Installation

```bash
npm install @issueflow/sdk
```

## 🏗️ Quick Start

### Basic Client Usage

```javascript
import { IssueFlowClient } from '@issueflow/sdk';

const client = new IssueFlowClient({
  apiUrl: 'https://api.issueflow.com',
  projectId: 'your-project-id',
  apiKey: 'your-api-key' // Optional for public projects
});

// Create an issue
const issue = await client.createIssue({
  title: 'Bug in checkout process',
  description: 'Users cannot complete payment',
  priority: 'high',
  category: 'bug',
  reporter: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

console.log('Created issue:', issue.id);
```

### Widget Integration

```html
<!-- Add widget to your webpage -->
<script src="https://cdn.issueflow.com/widget.js"></script>
<script>
  IssueFlow.init({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id',
    position: 'bottom-right',
    triggerText: 'Report Issue',
    theme: 'auto',
    enableScreenshot: true
  });
</script>
```

## 🔧 Configuration

### Client Configuration

```typescript
interface IssueFlowConfig {
  apiUrl: string;           // IssueFlow API base URL
  projectId: string;        // Your project ID
  apiKey?: string;          // API key (optional for public projects)
  timeout?: number;         // Request timeout in ms (default: 30000)
  debug?: boolean;          // Enable debug logging
  headers?: Record<string, string>; // Custom headers
}
```

### Widget Configuration

```typescript
interface WidgetConfig {
  // Basic config
  apiUrl: string;
  projectId: string;
  
  // UI customization
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  triggerText?: string;
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  
  // Features
  enableScreenshot?: boolean;
  captureConsoleErrors?: boolean;
  customFields?: CustomField[];
  requiredFields?: string[];
  
  // Messages
  welcomeMessage?: string;
  successMessage?: string;
  showPoweredBy?: boolean;
}
```

## 📊 API Reference

### Issues

```typescript
// Create issue
const issue = await client.createIssue({
  title: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  category?: 'bug' | 'feature_request' | 'improvement' | 'question' | 'other';
  reporter: {
    email: string;
    name: string;
  };
  attachments?: string[];
  customFields?: Record<string, any>;
  metadata?: {
    userAgent?: string;
    url?: string;
    viewport?: { width: number; height: number };
    sessionId?: string;
  };
});

// Get issue
const issue = await client.getIssue('issue-id');

// List issues
const issues = await client.listIssues({
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  search?: string;
});

// Update issue
const updated = await client.updateIssue('issue-id', {
  status: 'resolved',
  assignee: 'user-id'
});

// Delete issue
await client.deleteIssue('issue-id');
```

### File Uploads

```typescript
// Upload attachment
const result = await client.uploadAttachment(file, 'screenshot.png');
console.log('Upload URL:', result.url);

// Use in issue creation
const issue = await client.createIssue({
  title: 'Bug with screenshot',
  description: 'See attached image',
  attachments: [result.id], // Reference uploaded file
  reporter: { email: 'user@example.com', name: 'User' }
});
```

### Utility Functions

```typescript
import { 
  generateSessionId,
  getViewport,
  getCurrentUrl,
  getUserAgent,
  isValidEmail,
  sanitizeHtml,
  formatFileSize,
  validateFile,
  debounce,
  throttle,
  retry
} from '@issueflow/sdk';

// Generate unique session ID
const sessionId = generateSessionId();

// Get browser information
const viewport = getViewport();
const url = getCurrentUrl();
const userAgent = getUserAgent();

// Validation utilities
const isValid = isValidEmail('user@example.com');
const safe = sanitizeHtml('<script>alert("xss")</script>');

// File utilities
const size = formatFileSize(1024 * 1024); // "1 MB"
const validation = validateFile(file, ['image/*'], 5 * 1024 * 1024);

// Performance utilities
const debouncedFn = debounce(() => console.log('Called'), 300);
const throttledFn = throttle(() => console.log('Called'), 1000);

// Retry failed operations
const result = await retry(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Failed');
  return response.json();
}, { maxAttempts: 3 });
```

## 🪝 Webhooks

Handle IssueFlow webhooks securely in your application:

```typescript
import { WebhookProcessor, WebhookVerifier } from '@issueflow/sdk';

// Create webhook processor
const processor = new WebhookProcessor('your-webhook-secret');

// Add event handlers
processor.addHandler('issue-handler', {
  async onIssueCreated(payload) {
    console.log('New issue:', payload.data.title);
    // Send notification, update database, etc.
  },
  
  async onIssueUpdated(payload) {
    console.log('Issue updated:', payload.data.id);
  },
  
  async onIssueDeleted(payload) {
    console.log('Issue deleted:', payload.data.id);
  }
});

// Express.js middleware
app.use('/webhooks/issueflow', express.raw({ type: 'application/json' }));
app.post('/webhooks/issueflow', async (req, res) => {
  const signature = req.headers['x-issueflow-signature'];
  const payload = req.body.toString();
  
  const result = await processor.processWebhook(payload, signature);
  
  if (result.success) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
});
```

### Testing Webhooks

```typescript
import { WebhookTester } from '@issueflow/sdk';

const tester = new WebhookTester('webhook-secret');

// Create test payload
const { payload, signature } = tester.createTestPayload('issue.created', {
  id: 'test-issue',
  title: 'Test Issue'
});

// Send test webhook
const result = await tester.sendTestWebhook(
  'https://your-app.com/webhooks/issueflow',
  'issue.created',
  { id: 'test-issue', title: 'Test Issue' }
);

console.log('Webhook result:', result);
```

## 🎨 Widget Examples

### React Integration

```jsx
import { useEffect } from 'react';
import { IssueFlowClient, createDefaultConfig } from '@issueflow/sdk';

function App() {
  useEffect(() => {
    const config = createDefaultConfig({
      apiUrl: 'https://api.issueflow.com',
      projectId: 'your-project-id',
      theme: 'dark',
      primaryColor: '#your-brand-color'
    });
    
    // Initialize widget
    if (window.IssueFlow) {
      window.IssueFlow.init(config);
    }
  }, []);

  return <div>Your app content</div>;
}
```

### Vue.js Integration

```vue
<template>
  <div>Your app content</div>
</template>

<script>
import { createDefaultConfig } from '@issueflow/sdk';

export default {
  mounted() {
    const config = createDefaultConfig({
      apiUrl: 'https://api.issueflow.com',
      projectId: 'your-project-id',
      customFields: [
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' }
          ],
          required: true
        }
      ]
    });
    
    window.IssueFlow?.init(config);
  }
};
</script>
```

### Custom Form Integration

```typescript
import { IssueFlowClient, enrichIssueMetadata } from '@issueflow/sdk';

const client = new IssueFlowClient(config);

// Handle form submission
async function handleSubmit(formData: FormData) {
  const issue = enrichIssueMetadata({
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    reporter: {
      email: formData.get('email') as string,
      name: formData.get('name') as string
    }
  });
  
  try {
    const result = await client.createIssue(issue);
    console.log('Issue created:', result.id);
    showSuccess('Thank you! We\'ll get back to you soon.');
  } catch (error) {
    console.error('Failed to create issue:', error);
    showError('Something went wrong. Please try again.');
  }
}
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode  
npm run test:watch
```

### Test Results
The SDK includes 33 comprehensive tests covering:
- ✅ Type validation and schemas
- ✅ Utility functions
- ✅ HTTP client functionality  
- ✅ Webhook processing
- ✅ Error handling

```
📊 Test Results: 33/33 passed, 0 failed
🎉 All SDK core tests passed!
```

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Modern mobile browsers

## 🚀 Performance

- **Bundle Size**: ~15KB gzipped
- **Tree Shakable**: Import only what you need
- **CDN Available**: Fast global delivery
- **No Dependencies**: Core utilities work standalone

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development build
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
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
- 🎮 [Interactive Examples](https://examples.issueflow.com)
- 🐛 [Issue Tracker](https://github.com/yosnap/issueflow/issues)
- 💬 [Discussions](https://github.com/yosnap/issueflow/discussions)
- 📧 Email: yosnap@gmail.com

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
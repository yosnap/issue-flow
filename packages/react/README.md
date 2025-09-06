# @issueflow/react

> React components and hooks for IssueFlow feedback widgets

Beautiful, customizable React components for collecting user feedback and issue reports. Built on top of the IssueFlow SDK with full TypeScript support.

## 🚀 Features

- **React Hooks**: `useIssueFlow`, `useIssueSubmit`, `useWebhook`
- **Components**: `<IssueFlowWidget>`, `<FeedbackButton>`, `<IssueForm>`
- **TypeScript**: Full type safety with React 18+ support
- **Customizable**: Themeable components with CSS-in-JS
- **Accessibility**: WCAG 2.1 compliant components
- **Screenshots**: Built-in screenshot capture
- **Responsive**: Mobile-first design
- **SSR Ready**: Server-side rendering support

## 📦 Installation

```bash
npm install @issueflow/react
```

### Peer Dependencies

```bash
npm install react react-dom
```

## 🏗️ Quick Start

### Basic Widget

```jsx
import { IssueFlowWidget } from '@issueflow/react';

function App() {
  return (
    <div>
      <h1>My App</h1>
      
      <IssueFlowWidget
        apiUrl="https://api.issueflow.com"
        projectId="your-project-id"
        position="bottom-right"
        triggerText="Report Issue"
      />
    </div>
  );
}
```

### Custom Feedback Form

```jsx
import { IssueForm, useIssueSubmit } from '@issueflow/react';

function CustomFeedback() {
  const { submitIssue, isLoading, error } = useIssueSubmit({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id'
  });

  const handleSubmit = async (data) => {
    try {
      await submitIssue({
        title: data.title,
        description: data.description,
        priority: data.priority,
        reporter: {
          email: data.email,
          name: data.name
        }
      });
      
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  return (
    <IssueForm
      onSubmit={handleSubmit}
      loading={isLoading}
      error={error}
      customFields={[
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'normal' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' }
          ],
          required: true
        }
      ]}
    />
  );
}
```

## 🎣 Hooks

### useIssueFlow

Main hook for IssueFlow integration:

```jsx
import { useIssueFlow } from '@issueflow/react';

function MyComponent() {
  const { client, isReady, error } = useIssueFlow({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id',
    apiKey: 'your-api-key' // Optional
  });

  const createIssue = async () => {
    if (isReady) {
      const issue = await client.createIssue({
        title: 'Bug report',
        description: 'Something went wrong',
        reporter: { email: 'user@example.com', name: 'User' }
      });
      
      console.log('Created:', issue.id);
    }
  };

  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <button onClick={createIssue} disabled={!isReady}>
      Report Issue
    </button>
  );
}
```

### useIssueSubmit

Simplified hook for form submissions:

```jsx
import { useIssueSubmit } from '@issueflow/react';

function FeedbackForm() {
  const { submitIssue, isLoading, error, success } = useIssueSubmit({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id',
    onSuccess: (issue) => {
      console.log('Issue created:', issue.id);
    },
    onError: (error) => {
      console.error('Submit failed:', error);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    submitIssue({
      title: formData.get('title'),
      description: formData.get('description'),
      reporter: {
        email: formData.get('email'),
        name: formData.get('name')
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Issue title" required />
      <textarea name="description" placeholder="Describe the issue" required />
      <input name="email" type="email" placeholder="Your email" required />
      <input name="name" placeholder="Your name" required />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit Issue'}
      </button>
      
      {error && <div className="error">{error.message}</div>}
      {success && <div className="success">Thank you for your feedback!</div>}
    </form>
  );
}
```

### useWebhook

Handle webhook events in React:

```jsx
import { useWebhook } from '@issueflow/react';

function Dashboard() {
  const { events, isConnected } = useWebhook('ws://localhost:3001');

  useEffect(() => {
    events.on('issue.created', (payload) => {
      toast.success(`New issue: ${payload.data.title}`);
    });

    events.on('issue.updated', (payload) => {
      toast.info(`Issue updated: ${payload.data.title}`);
    });

    return () => events.removeAllListeners();
  }, [events]);

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Your dashboard content */}
    </div>
  );
}
```

## 🎨 Components

### IssueFlowWidget

Full-featured feedback widget:

```jsx
<IssueFlowWidget
  // Required
  apiUrl="https://api.issueflow.com"
  projectId="your-project-id"
  
  // UI Customization
  position="bottom-right" // bottom-left, top-right, top-left
  triggerText="Feedback"
  theme="auto" // light, dark, auto
  primaryColor="#2563eb"
  
  // Features
  enableScreenshot={true}
  captureConsoleErrors={true}
  showPoweredBy={true}
  
  // Messages
  welcomeMessage="We'd love to hear your feedback!"
  successMessage="Thank you! We'll get back to you soon."
  
  // Custom Fields
  customFields={[
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Bug Report', value: 'bug' },
        { label: 'Feature Request', value: 'feature' },
        { label: 'Question', value: 'question' }
      ],
      required: true
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'normal' },
        { label: 'High', value: 'high' }
      ]
    }
  ]}
  
  // Event Handlers
  onSubmit={(issue) => console.log('Submitted:', issue)}
  onError={(error) => console.error('Error:', error)}
  onOpen={() => console.log('Widget opened')}
  onClose={() => console.log('Widget closed')}
/>
```

### FeedbackButton

Standalone trigger button:

```jsx
<FeedbackButton
  onClick={() => setModalOpen(true)}
  theme="dark"
  size="large"
  icon="message"
>
  Send Feedback
</FeedbackButton>
```

### IssueForm

Customizable form component:

```jsx
<IssueForm
  onSubmit={handleSubmit}
  loading={isSubmitting}
  error={submitError}
  
  // Form Configuration
  requiredFields={['title', 'description', 'reporter.email']}
  showScreenshotCapture={true}
  showFileUpload={true}
  
  // Styling
  className="my-feedback-form"
  style={{ maxWidth: 600 }}
  
  // Custom Fields
  customFields={[
    {
      name: 'urgency',
      label: 'How urgent is this?',
      type: 'select',
      options: [
        { label: 'Can wait', value: 'low' },
        { label: 'Soon', value: 'medium' },
        { label: 'ASAP', value: 'high' }
      ]
    },
    {
      name: 'reproduced',
      label: 'Can you reproduce this issue?',
      type: 'boolean',
      defaultValue: false
    }
  ]}
/>
```

## 🎨 Theming

### CSS Variables

Customize the appearance using CSS variables:

```css
:root {
  --issueflow-primary: #2563eb;
  --issueflow-primary-hover: #1d4ed8;
  --issueflow-background: #ffffff;
  --issueflow-foreground: #1f2937;
  --issueflow-border: #e5e7eb;
  --issueflow-border-radius: 8px;
  --issueflow-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}

/* Dark theme */
[data-theme='dark'] {
  --issueflow-background: #1f2937;
  --issueflow-foreground: #f9fafb;
  --issueflow-border: #374151;
}
```

### Styled Components

Use with styled-components or emotion:

```jsx
import styled from 'styled-components';
import { IssueFlowWidget } from '@issueflow/react';

const StyledWidget = styled(IssueFlowWidget)`
  --issueflow-primary: ${props => props.theme.colors.primary};
  --issueflow-background: ${props => props.theme.colors.background};
  
  .issueflow-trigger {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 50px;
  }
  
  .issueflow-modal {
    backdrop-filter: blur(8px);
  }
`;
```

### Tailwind CSS

Works great with Tailwind CSS:

```jsx
<IssueFlowWidget
  className="font-sans"
  triggerClassName="bg-blue-600 hover:bg-blue-700 text-white"
  modalClassName="bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
  // ... other props
/>
```

## 📱 Examples

### Next.js App Router

```jsx
// app/layout.tsx
import { IssueFlowWidget } from '@issueflow/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        <IssueFlowWidget
          apiUrl={process.env.NEXT_PUBLIC_ISSUEFLOW_API_URL}
          projectId={process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID}
          position="bottom-right"
          theme="auto"
        />
      </body>
    </html>
  );
}
```

### Vite + React

```jsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/App.tsx
import { IssueFlowWidget } from '@issueflow/react';

function App() {
  return (
    <div>
      <h1>My Vite App</h1>
      
      <IssueFlowWidget
        apiUrl={import.meta.env.VITE_ISSUEFLOW_API_URL}
        projectId={import.meta.env.VITE_ISSUEFLOW_PROJECT_ID}
      />
    </div>
  );
}

export default App;
```

### Custom Modal Integration

```jsx
import { Modal } from 'react-modal';
import { IssueForm, useIssueSubmit } from '@issueflow/react';

function CustomFeedbackModal({ isOpen, onClose }) {
  const { submitIssue, isLoading } = useIssueSubmit({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id',
    onSuccess: () => {
      onClose();
      toast.success('Feedback submitted!');
    }
  });

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <div className="modal-header">
        <h2>Send Feedback</h2>
        <button onClick={onClose}>×</button>
      </div>
      
      <IssueForm
        onSubmit={submitIssue}
        loading={isLoading}
        showScreenshotCapture={true}
        customFields={[
          {
            name: 'page',
            label: 'Current Page',
            type: 'text',
            defaultValue: window.location.pathname,
            disabled: true
          }
        ]}
      />
    </Modal>
  );
}
```

## 🧪 Testing

### Jest + React Testing Library

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssueFlowWidget } from '@issueflow/react';

test('renders feedback widget', () => {
  render(
    <IssueFlowWidget
      apiUrl="https://api.test.com"
      projectId="test-project"
      triggerText="Test Feedback"
    />
  );
  
  expect(screen.getByText('Test Feedback')).toBeInTheDocument();
});

test('submits feedback successfully', async () => {
  const mockSubmit = jest.fn().mockResolvedValue({ id: 'issue-123' });
  
  render(
    <IssueFlowWidget
      apiUrl="https://api.test.com"
      projectId="test-project"
      onSubmit={mockSubmit}
    />
  );
  
  // Open widget
  fireEvent.click(screen.getByText('Feedback'));
  
  // Fill form
  fireEvent.change(screen.getByPlaceholderText('Issue title'), {
    target: { value: 'Test issue' }
  });
  
  // Submit
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test issue'
      })
    );
  });
});
```

## 🚀 Performance

- **Bundle Size**: ~12KB gzipped (excluding React)
- **Tree Shaking**: Import only components you use
- **Lazy Loading**: Components load on demand
- **Memoized**: Optimized re-renders with React.memo

## ♿ Accessibility

- **WCAG 2.1 AA** compliant
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: Meets accessibility standards

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

- 📖 [Documentation](https://docs.issueflow.com/react)
- 🎮 [Storybook Examples](https://storybook.issueflow.com)
- 🐛 [Issue Tracker](https://github.com/yosnap/issueflow/issues)
- 💬 [Discussions](https://github.com/yosnap/issueflow/discussions)
- 📧 Email: yosnap@gmail.com

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
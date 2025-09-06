# @issueflow/svelte

> Svelte components and stores for IssueFlow feedback widgets

Lightweight Svelte components for collecting user feedback. Built for Svelte 5+ with SvelteKit support and full TypeScript integration.

## 🚀 Features

- **Svelte 5**: Built for the latest Svelte with runes
- **SvelteKit**: SSR and static site generation support
- **Stores**: Reactive stores for state management
- **TypeScript**: Full type safety
- **Actions**: Svelte actions for DOM integration
- **Lightweight**: Minimal bundle size
- **Accessible**: WCAG 2.1 compliant

## 📦 Installation

```bash
npm install @issueflow/svelte
```

## 🏗️ Quick Start

### Basic Widget

```svelte
<!-- App.svelte -->
<script>
  import { IssueFlowWidget } from '@issueflow/svelte';
</script>

<main>
  <h1>My Svelte App</h1>
  
  <IssueFlowWidget
    apiUrl="https://api.issueflow.com"
    projectId="your-project-id"
    position="bottom-right"
    triggerText="Report Issue"
  />
</main>
```

### SvelteKit Integration

```js
// app.html
export const load = async ({ url }) => {
  return {
    issueflowConfig: {
      apiUrl: 'https://api.issueflow.com',
      projectId: 'your-project-id',
      metadata: {
        url: url.pathname
      }
    }
  };
};
```

```svelte
<!-- +layout.svelte -->
<script>
  import { IssueFlowWidget } from '@issueflow/svelte';
  
  export let data;
</script>

<main>
  <slot />
</main>

<IssueFlowWidget {...data.issueflowConfig} />
```

## 🏪 Stores

### issueFlowStore

```svelte
<script>
  import { issueFlowStore } from '@issueflow/svelte';
  
  const store = issueFlowStore({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id'
  });

  async function createIssue() {
    try {
      const issue = await store.submitIssue({
        title: 'Bug report',
        description: 'Something went wrong',
        reporter: { email: 'user@example.com', name: 'User' }
      });
      
      console.log('Created:', issue.id);
    } catch (error) {
      console.error('Failed to create issue:', error);
    }
  }
</script>

<button on:click={createIssue} disabled={$store.isLoading}>
  {$store.isLoading ? 'Submitting...' : 'Report Issue'}
</button>

{#if $store.error}
  <div class="error">Error: {$store.error.message}</div>
{/if}
```

## 🎨 Components

### IssueFlowWidget

```svelte
<IssueFlowWidget
  apiUrl="https://api.issueflow.com"
  projectId="your-project-id"
  
  {/* UI Customization */}
  position="bottom-right"
  triggerText="Feedback"
  theme="auto"
  primaryColor="#2563eb"
  
  {/* Features */}
  enableScreenshot={true}
  captureConsoleErrors={true}
  showPoweredBy={true}
  
  {/* Custom Fields */}
  customFields={[
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Bug Report', value: 'bug' },
        { label: 'Feature Request', value: 'feature' }
      ],
      required: true
    }
  ]}
  
  {/* Event Handlers */}
  on:submit={handleSubmit}
  on:error={handleError}
  on:open={handleOpen}
  on:close={handleClose}
/>
```

### FeedbackForm

```svelte
<script>
  import { FeedbackForm } from '@issueflow/svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let isSubmitting = false;
  let submitError = null;

  async function handleSubmit(event) {
    isSubmitting = true;
    submitError = null;
    
    try {
      await submitIssue(event.detail);
      dispatch('success');
    } catch (error) {
      submitError = error;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<FeedbackForm
  loading={isSubmitting}
  error={submitError}
  requiredFields={['title', 'description', 'reporter.email']}
  showScreenshotCapture={true}
  on:submit={handleSubmit}
/>
```

## ⚙️ Actions

### use:issueflow

DOM action for easy integration:

```svelte
<script>
  import { issueflow } from '@issueflow/svelte/actions';
  
  const config = {
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id',
    trigger: 'click'
  };
</script>

<button use:issueflow={config}>
  Send Feedback
</button>
```

## 🎨 Styling

### CSS Custom Properties

```css
:global(:root) {
  --issueflow-primary: #2563eb;
  --issueflow-background: #ffffff;
  --issueflow-foreground: #1f2937;
  --issueflow-border-radius: 8px;
}
```

### Scoped Styles

```svelte
<style>
  :global(.issueflow-widget) {
    --issueflow-primary: var(--brand-color);
  }
  
  .custom-trigger {
    background: var(--issueflow-primary);
    border-radius: 50px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
</style>
```

## 📝 License

MIT © [Paulo Sánchez](https://github.com/yosnap)

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
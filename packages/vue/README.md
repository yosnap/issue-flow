# @issueflow/vue

> Vue.js components and composables for IssueFlow feedback widgets

Modern Vue.js components for collecting user feedback and issue reports. Built with Vue 3 Composition API and full TypeScript support.

## 🚀 Features

- **Vue 3**: Built for Vue 3 with Composition API
- **Composables**: `useIssueFlow`, `useIssueSubmit`, `useWebhook`
- **Components**: `<IssueFlowWidget>`, `<FeedbackButton>`, `<IssueForm>`
- **TypeScript**: Full type safety with Vue 3
- **Reactive**: Fully reactive with Vue's reactivity system
- **Teleport**: Modal components use Vue 3 Teleport
- **SSR Ready**: Nuxt.js compatible
- **Auto Import**: Works with unplugin-auto-import

## 📦 Installation

```bash
npm install @issueflow/vue
```

### Peer Dependencies

```bash
npm install vue@^3.0.0
```

## 🏗️ Quick Start

### Global Registration

```js
// main.js
import { createApp } from 'vue';
import IssueFlowVue from '@issueflow/vue';
import App from './App.vue';

const app = createApp(App);

app.use(IssueFlowVue, {
  apiUrl: 'https://api.issueflow.com',
  projectId: 'your-project-id'
});

app.mount('#app');
```

### Component Usage

```vue
<template>
  <div>
    <h1>My Vue App</h1>
    
    <IssueFlowWidget
      api-url="https://api.issueflow.com"
      project-id="your-project-id"
      position="bottom-right"
      trigger-text="Report Issue"
      theme="auto"
      :enable-screenshot="true"
    />
  </div>
</template>

<script setup>
import { IssueFlowWidget } from '@issueflow/vue';
</script>
```

## 🪄 Composables

### useIssueFlow

Main composable for IssueFlow integration:

```vue
<script setup>
import { useIssueFlow } from '@issueflow/vue';

const { client, isReady, error } = useIssueFlow({
  apiUrl: 'https://api.issueflow.com',
  projectId: 'your-project-id',
  apiKey: 'your-api-key' // Optional
});

const createIssue = async () => {
  if (isReady.value) {
    const issue = await client.value.createIssue({
      title: 'Bug report',
      description: 'Something went wrong',
      reporter: { email: 'user@example.com', name: 'User' }
    });
    
    console.log('Created:', issue.id);
  }
};
</script>

<template>
  <div>
    <div v-if="error" class="error">Error: {{ error.message }}</div>
    
    <button @click="createIssue" :disabled="!isReady">
      Report Issue
    </button>
  </div>
</template>
```

### useIssueSubmit

Simplified composable for form submissions:

```vue
<script setup>
import { useIssueSubmit } from '@issueflow/vue';

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

const form = reactive({
  title: '',
  description: '',
  email: '',
  name: ''
});

const handleSubmit = () => {
  submitIssue({
    title: form.title,
    description: form.description,
    reporter: {
      email: form.email,
      name: form.name
    }
  });
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.title" placeholder="Issue title" required />
    <textarea v-model="form.description" placeholder="Describe the issue" required />
    <input v-model="form.email" type="email" placeholder="Your email" required />
    <input v-model="form.name" placeholder="Your name" required />
    
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Submitting...' : 'Submit Issue' }}
    </button>
    
    <div v-if="error" class="error">{{ error.message }}</div>
    <div v-if="success" class="success">Thank you for your feedback!</div>
  </form>
</template>
```

### useWebhook

Handle webhook events in Vue:

```vue
<script setup>
import { useWebhook } from '@issueflow/vue';
import { toast } from '@/utils/toast';

const { events, isConnected } = useWebhook('ws://localhost:3001');

watchEffect(() => {
  if (events.value) {
    events.value.on('issue.created', (payload) => {
      toast.success(`New issue: ${payload.data.title}`);
    });

    events.value.on('issue.updated', (payload) => {
      toast.info(`Issue updated: ${payload.data.title}`);
    });
  }
});

onUnmounted(() => {
  events.value?.removeAllListeners();
});
</script>

<template>
  <div>
    <div :class="{ connected: isConnected, disconnected: !isConnected }">
      Status: {{ isConnected ? 'Connected' : 'Disconnected' }}
    </div>
    <!-- Your dashboard content -->
  </div>
</template>
```

## 🎨 Components

### IssueFlowWidget

Full-featured feedback widget:

```vue
<template>
  <IssueFlowWidget
    api-url="https://api.issueflow.com"
    project-id="your-project-id"
    
    <!-- UI Customization -->
    position="bottom-right"
    trigger-text="Feedback"
    theme="auto"
    primary-color="#2563eb"
    
    <!-- Features -->
    :enable-screenshot="true"
    :capture-console-errors="true"
    :show-powered-by="true"
    
    <!-- Messages -->
    welcome-message="We'd love to hear your feedback!"
    success-message="Thank you! We'll get back to you soon."
    
    <!-- Custom Fields -->
    :custom-fields="[
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
      }
    ]"
    
    <!-- Event Handlers -->
    @submit="onSubmit"
    @error="onError"
    @open="onOpen"
    @close="onClose"
  />
</template>

<script setup>
const onSubmit = (issue) => {
  console.log('Submitted:', issue);
};

const onError = (error) => {
  console.error('Error:', error);
};

const onOpen = () => {
  console.log('Widget opened');
};

const onClose = () => {
  console.log('Widget closed');
};
</script>
```

### FeedbackButton

Standalone trigger button:

```vue
<template>
  <FeedbackButton
    @click="openModal"
    theme="dark"
    size="large"
    icon="message"
  >
    Send Feedback
  </FeedbackButton>
</template>

<script setup>
import { ref } from 'vue';

const modalOpen = ref(false);

const openModal = () => {
  modalOpen.value = true;
};
</script>
```

### IssueForm

Customizable form component:

```vue
<template>
  <IssueForm
    @submit="handleSubmit"
    :loading="isSubmitting"
    :error="submitError"
    
    <!-- Form Configuration -->
    :required-fields="['title', 'description', 'reporter.email']"
    :show-screenshot-capture="true"
    :show-file-upload="true"
    
    <!-- Styling -->
    class="my-feedback-form"
    :style="{ maxWidth: '600px' }"
    
    <!-- Custom Fields -->
    :custom-fields="[
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
    ]"
  />
</template>

<script setup>
const isSubmitting = ref(false);
const submitError = ref(null);

const handleSubmit = async (data) => {
  isSubmitting.value = true;
  submitError.value = null;
  
  try {
    await submitIssue(data);
  } catch (error) {
    submitError.value = error;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
```

## 🎨 Styling

### CSS Variables

Customize appearance using CSS variables:

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

[data-theme='dark'] {
  --issueflow-background: #1f2937;
  --issueflow-foreground: #f9fafb;
  --issueflow-border: #374151;
}
```

### Scoped Styles

Use Vue's scoped styles:

```vue
<template>
  <IssueFlowWidget class="custom-widget" />
</template>

<style scoped>
.custom-widget {
  --issueflow-primary: v-bind(primaryColor);
  --issueflow-border-radius: 16px;
}

.custom-widget :deep(.issueflow-trigger) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 50px;
}

.custom-widget :deep(.issueflow-modal) {
  backdrop-filter: blur(8px);
}
</style>

<script setup>
const primaryColor = ref('#2563eb');
</script>
```

### UnoCSS / Tailwind

Works great with utility-first CSS:

```vue
<template>
  <IssueFlowWidget
    class="font-sans"
    trigger-class="bg-blue-600 hover:bg-blue-700 text-white"
    modal-class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
  />
</template>
```

## 📱 Examples

### Nuxt 3

```js
// plugins/issueflow.client.js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(IssueFlowVue, {
    apiUrl: useRuntimeConfig().public.issueflowApiUrl,
    projectId: useRuntimeConfig().public.issueflowProjectId
  });
});
```

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtPage />
    
    <ClientOnly>
      <IssueFlowWidget position="bottom-right" />
    </ClientOnly>
  </div>
</template>
```

### Vite + Vue

```js
// main.js
import { createApp } from 'vue';
import IssueFlowVue from '@issueflow/vue';
import App from './App.vue';

const app = createApp(App);

app.use(IssueFlowVue, {
  apiUrl: import.meta.env.VITE_ISSUEFLOW_API_URL,
  projectId: import.meta.env.VITE_ISSUEFLOW_PROJECT_ID
});

app.mount('#app');
```

### Custom Modal with Teleport

```vue
<template>
  <div>
    <button @click="showModal = true">
      Open Feedback
    </button>
    
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Send Feedback</h2>
            <button @click="showModal = false">×</button>
          </div>
          
          <IssueForm
            @submit="handleSubmit"
            :loading="isLoading"
            :show-screenshot-capture="true"
            :custom-fields="[
              {
                name: 'page',
                label: 'Current Page',
                type: 'text',
                defaultValue: $route.path,
                disabled: true
              }
            ]"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useIssueSubmit } from '@issueflow/vue';

const router = useRouter();
const showModal = ref(false);

const { submitIssue, isLoading } = useIssueSubmit({
  apiUrl: 'https://api.issueflow.com',
  projectId: 'your-project-id',
  onSuccess: () => {
    showModal.value = false;
    // Show toast notification
  }
});

const handleSubmit = async (data) => {
  await submitIssue(data);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
```

### Pinia Store Integration

```js
// stores/feedback.js
import { defineStore } from 'pinia';
import { useIssueFlow } from '@issueflow/vue';

export const useFeedbackStore = defineStore('feedback', () => {
  const issues = ref([]);
  const isLoading = ref(false);
  
  const { client } = useIssueFlow({
    apiUrl: 'https://api.issueflow.com',
    projectId: 'your-project-id'
  });

  const fetchIssues = async () => {
    isLoading.value = true;
    try {
      const response = await client.value.listIssues();
      issues.value = response.issues;
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createIssue = async (issueData) => {
    const issue = await client.value.createIssue(issueData);
    issues.value.unshift(issue);
    return issue;
  };

  return {
    issues: readonly(issues),
    isLoading: readonly(isLoading),
    fetchIssues,
    createIssue
  };
});
```

## 🧪 Testing

### Vitest + Vue Test Utils

```js
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { IssueFlowWidget } from '@issueflow/vue';

describe('IssueFlowWidget', () => {
  it('renders feedback widget', () => {
    const wrapper = mount(IssueFlowWidget, {
      props: {
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        triggerText: 'Test Feedback'
      }
    });
    
    expect(wrapper.text()).toContain('Test Feedback');
  });

  it('submits feedback successfully', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ id: 'issue-123' });
    
    const wrapper = mount(IssueFlowWidget, {
      props: {
        apiUrl: 'https://api.test.com',
        projectId: 'test-project',
        onSubmit: mockSubmit
      }
    });
    
    // Open widget
    await wrapper.find('.issueflow-trigger').trigger('click');
    
    // Fill form
    const titleInput = wrapper.find('input[placeholder*="title"]');
    await titleInput.setValue('Test issue');
    
    // Submit
    await wrapper.find('form').trigger('submit');
    
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test issue'
      })
    );
  });
});
```

## 📦 Auto-import

Works with unplugin-auto-import:

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        {
          '@issueflow/vue': [
            'useIssueFlow',
            'useIssueSubmit',
            'useWebhook'
          ]
        }
      ]
    })
  ]
});
```

## 🚀 Performance

- **Bundle Size**: ~10KB gzipped (excluding Vue)
- **Tree Shaking**: Import only components you use
- **Lazy Loading**: Components load on demand
- **Optimized**: Uses Vue 3's performance optimizations

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

- 📖 [Documentation](https://docs.issueflow.com/vue)
- 🎮 [Interactive Examples](https://examples.issueflow.com/vue)
- 🐛 [Issue Tracker](https://github.com/yosnap/issueflow/issues)
- 💬 [Discussions](https://github.com/yosnap/issueflow/discussions)
- 📧 Email: yosnap@gmail.com

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
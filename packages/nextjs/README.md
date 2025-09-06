# @issueflow/nextjs

> Next.js integration for IssueFlow feedback widgets

Seamless integration of IssueFlow feedback widgets with Next.js applications. Supports both App Router and Pages Router with full TypeScript support.

## 🚀 Features

- **Next.js 13+ Support**: App Router and Pages Router
- **Server Components**: RSC-compatible components
- **SSR Ready**: Server-side rendering support
- **TypeScript**: Full type safety
- **Middleware**: Built-in route protection
- **API Routes**: Pre-built API endpoints
- **Edge Runtime**: Compatible with Edge runtime

## 📦 Installation

```bash
npm install @issueflow/nextjs
```

## 🏗️ Quick Start

### App Router (Next.js 13+)

```jsx
// app/layout.tsx
import { IssueFlowProvider } from '@issueflow/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <IssueFlowProvider
          apiUrl={process.env.NEXT_PUBLIC_ISSUEFLOW_API_URL!}
          projectId={process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID!}
        >
          {children}
        </IssueFlowProvider>
      </body>
    </html>
  );
}
```

```jsx
// app/feedback/page.tsx
import { IssueFlowWidget } from '@issueflow/nextjs';

export default function FeedbackPage() {
  return (
    <div>
      <h1>Feedback</h1>
      <IssueFlowWidget position="center" />
    </div>
  );
}
```

### Pages Router

```jsx
// pages/_app.tsx
import { IssueFlowProvider } from '@issueflow/nextjs';

export default function App({ Component, pageProps }) {
  return (
    <IssueFlowProvider
      apiUrl={process.env.NEXT_PUBLIC_ISSUEFLOW_API_URL!}
      projectId={process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID!}
    >
      <Component {...pageProps} />
    </IssueFlowProvider>
  );
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_ISSUEFLOW_API_URL=https://api.issueflow.com
NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID=your-project-id
ISSUEFLOW_API_KEY=your-api-key
```

### Next.js Config

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    ISSUEFLOW_API_URL: process.env.ISSUEFLOW_API_URL,
  },
};

module.exports = nextConfig;
```

## 📊 API Routes

### Built-in Endpoints

```jsx
// pages/api/feedback.js (Pages Router)
// app/api/feedback/route.ts (App Router)
import { createIssueFlowHandler } from '@issueflow/nextjs/api';

export default createIssueFlowHandler({
  apiKey: process.env.ISSUEFLOW_API_KEY,
  projectId: process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID
});
```

### Custom API Route

```jsx
// app/api/issues/route.ts
import { NextRequest } from 'next/server';
import { IssueFlowClient } from '@issueflow/nextjs';

const client = new IssueFlowClient({
  apiUrl: process.env.ISSUEFLOW_API_URL!,
  projectId: process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID!,
  apiKey: process.env.ISSUEFLOW_API_KEY
});

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  try {
    const issue = await client.createIssue(data);
    return Response.json({ success: true, issue });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

## 🎨 Components

### Server Components

```jsx
// app/components/FeedbackWidget.tsx (Server Component)
import { IssueFlowWidget } from '@issueflow/nextjs/server';

export default function FeedbackWidget() {
  return (
    <IssueFlowWidget
      apiUrl={process.env.NEXT_PUBLIC_ISSUEFLOW_API_URL!}
      projectId={process.env.NEXT_PUBLIC_ISSUEFLOW_PROJECT_ID!}
      position="bottom-right"
      theme="auto"
    />
  );
}
```

### Client Components

```jsx
'use client';

import { useIssueFlow } from '@issueflow/nextjs';
import { useState } from 'react';

export default function CustomFeedback() {
  const { submitIssue, isLoading } = useIssueFlow();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (data) => {
    try {
      await submitIssue(data);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Feedback
      </button>
      
      {isOpen && (
        <FeedbackModal
          onSubmit={handleSubmit}
          onClose={() => setIsOpen(false)}
          loading={isLoading}
        />
      )}
    </>
  );
}
```

## 📝 License

MIT © [Paulo Sánchez](https://github.com/yosnap)

---

**Part of the IssueFlow Framework** - [Learn more](https://github.com/yosnap/issueflow)
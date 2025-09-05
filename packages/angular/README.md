# @issueflow/angular

🅰️ **Official Angular adapter for IssueFlow** - Seamless feedback collection and issue tracking for Angular applications.

[![npm version](https://badge.fury.io/js/%40issueflow%2Fangular.svg)](https://www.npmjs.com/package/@issueflow/angular)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🚀 **Angular-Native**: Built specifically for Angular with full TypeScript support
- 📱 **Reactive**: RxJS-powered reactive state management
- 🔧 **Standalone Components**: Support for both standalone and module-based components
- 🎨 **Customizable**: Full theme and behavior customization
- 🔒 **Type Safe**: Complete TypeScript definitions and validation
- 📊 **Analytics**: Built-in event tracking and user context
- 🌐 **Accessible**: WCAG compliant with full keyboard navigation
- 📦 **Tree Shakable**: Optimized bundle size with ES modules

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @issueflow/angular @issueflow/sdk

# Using yarn
yarn add @issueflow/angular @issueflow/sdk

# Using pnpm
pnpm add @issueflow/angular @issueflow/sdk

# Using Angular CLI with IssueFlow
npx create-issueflow my-app --framework angular
# or
ng new my-app
cd my-app
npx issueflow init
```

### Basic Setup

#### 1. Module-based Setup (Traditional)

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IssueFlowModule } from '@issueflow/angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IssueFlowModule.forRoot({
      projectId: 'your-project-id',
      apiUrl: 'https://api.issueflow.dev',
      widget: {
        position: 'bottom-right',
        triggerText: 'Feedback',
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

```html
<!-- app.component.html -->
<div class="app">
  <h1>My Angular App</h1>
  
  <!-- Other content -->
  
  <!-- IssueFlow Widget -->
  <if-widget></if-widget>
</div>
```

#### 2. Standalone Components Setup (Modern)

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { IssueFlowModule } from '@issueflow/angular';

import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      IssueFlowModule.forRoot({
        projectId: 'your-project-id',
        apiUrl: 'https://api.issueflow.dev',
      })
    ),
  ],
});
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { IssueFlowWidgetComponent } from '@issueflow/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IssueFlowWidgetComponent],
  template: `
    <div class="app">
      <h1>My Angular App</h1>
      
      <!-- IssueFlow Widget -->
      <if-widget
        [position]="'bottom-right'"
        (issueSubmitted)="onFeedbackSubmitted($event)"
      ></if-widget>
    </div>
  `,
})
export class AppComponent {
  onFeedbackSubmitted(result: any) {
    console.log('Feedback submitted:', result);
  }
}
```

## 📖 Configuration

### Complete Configuration Example

```typescript
import { IssueFlowConfig } from '@issueflow/angular';

const config: IssueFlowConfig = {
  // Required
  projectId: 'your-project-id',
  apiUrl: 'https://api.issueflow.dev',
  
  // Optional
  organizationSlug: 'your-org',
  apiKey: 'your-api-key', // For private projects
  
  // Widget Configuration
  widget: {
    position: 'bottom-right',
    trigger: 'button',
    triggerText: 'Feedback',
    customCSS: './custom-widget.css',
  },
  
  // Theme Configuration
  theme: {
    mode: 'auto', // 'light' | 'dark' | 'auto'
    primaryColor: '#3b82f6',
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
  },
  
  // Behavior Configuration
  behavior: {
    captureConsoleErrors: false,
    captureUnhandledRejections: false,
    requireEmail: false,
    allowAnonymous: true,
    showSuccessMessage: true,
    autoClose: true,
    autoCloseDelay: 3000,
    allowFileUploads: true,
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/*', '.pdf', '.txt'],
  },
  
  // Integration Configuration
  integrations: {
    github: {
      enabled: true,
      repo: 'owner/repository',
      autoCreateIssues: true,
      labels: ['feedback', 'user-report'],
    },
    clickup: {
      enabled: false,
    },
    slack: {
      enabled: true,
      webhook: process.env['SLACK_WEBHOOK'],
      channel: '#feedback',
    },
  },
  
  // Angular-specific Configuration
  angular: {
    module: {
      lazyLoad: false,
      preload: true,
    },
    forms: {
      reactive: true,
    },
    animations: {
      enabled: true,
      duration: 300,
    },
  },
};
```

## 🎯 Usage Examples

### Programmatic Issue Submission

```typescript
import { Component, inject } from '@angular/core';
import { IssueFlowService } from '@issueflow/angular';

@Component({
  selector: 'app-my-component',
  template: `
    <button (click)="submitFeedback()">Send Feedback</button>
    <button (click)="reportBug()">Report Bug</button>
  `,
})
export class MyComponent {
  private issueFlowService = inject(IssueFlowService);
  
  async submitFeedback() {
    try {
      const result = await this.issueFlowService.submitIssue({
        title: 'Great feature!',
        description: 'I love the new dashboard design.',
        type: 'feedback',
        priority: 'medium',
        metadata: {
          component: 'dashboard',
          version: '2.1.0',
        },
      });
      
      console.log('Feedback submitted:', result);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }
  
  async reportBug() {
    try {
      const error = new Error('Something went wrong');
      
      const result = await this.issueFlowService.submitIssue({
        title: `Bug: ${error.message}`,
        description: `Stack trace:\n${error.stack}`,
        type: 'bug',
        priority: 'high',
        metadata: {
          errorName: error.name,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });
      
      console.log('Bug report submitted:', result);
    } catch (error) {
      console.error('Failed to report bug:', error);
    }
  }
}
```

### Custom Service with Business Logic

```typescript
import { Injectable, inject } from '@angular/core';
import { IssueFlowService } from '@issueflow/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private issueFlowService = inject(IssueFlowService);
  private contextSubject = new BehaviorSubject<Record<string, any>>({});
  
  readonly context$ = this.contextSubject.asObservable();

  async submitProductFeedback(
    rating: number,
    comment: string,
    category: string
  ) {
    return await this.issueFlowService.submitIssue({
      title: `Product feedback: ${category}`,
      description: `Rating: ${rating}/5\n\nComment: ${comment}`,
      type: 'feedback',
      priority: rating <= 2 ? 'high' : 'medium',
      metadata: {
        rating,
        category,
        source: 'product-feedback',
        context: this.contextSubject.value,
      },
    });
  }
  
  updateContext(context: Record<string, any>) {
    const currentContext = this.contextSubject.value;
    this.contextSubject.next({ ...currentContext, ...context });
  }
}
```

### Reactive State Management

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { IssueFlowService } from '@issueflow/angular';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-feedback-status',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="feedback-status">
      <div *ngIf="issueFlowService.loading$ | async" class="loading">
        Submitting feedback...
      </div>
      
      <div *ngIf="issueFlowService.error$ | async as error" class="error">
        Error: {{ error.message }}
      </div>
      
      <div class="stats">
        Total issues: {{ (issueFlowService.issues$ | async)?.length || 0 }}
      </div>
    </div>
  `,
})
export class FeedbackStatusComponent implements OnInit {
  protected issueFlowService = inject(IssueFlowService);
  
  ngOnInit() {
    // Load issues on component init
    this.issueFlowService.loadIssues();
  }
}
```

## 🎨 Styling & Theming

### CSS Custom Properties

```css
/* Override default theme */
:root {
  --if-primary-color: #your-brand-color;
  --if-border-radius: 12px;
  --if-font-family: 'Your Font', sans-serif;
}

/* Dark mode specific */
@media (prefers-color-scheme: dark) {
  :root {
    --if-background: #1a1a1a;
    --if-text: #ffffff;
  }
}
```

### Angular Material Integration

```typescript
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IssueFlowWidgetComponent } from '@issueflow/angular';

@Component({
  selector: 'app-material-integration',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, IssueFlowWidgetComponent],
  template: `
    <mat-button (click)="openFeedback()">
      <mat-icon>feedback</mat-icon>
      Send Feedback
    </mat-button>
    
    <if-widget [hidden]="true" #widget></if-widget>
  `,
  styles: [`
    ::ng-deep .if-widget {
      --if-primary-color: var(--mdc-theme-primary, #1976d2);
      font-family: 'Roboto', sans-serif;
    }
  `],
})
export class MaterialIntegrationComponent {
  openFeedback() {
    // Programmatically open the widget
    // Implementation depends on widget API
  }
}
```

## 🧪 Testing

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { IssueFlowService, IssueFlowTestingModule } from '@issueflow/angular';

describe('MyComponent', () => {
  let service: IssueFlowService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IssueFlowTestingModule.withMockService({
          projectId: 'test-project',
          apiUrl: 'https://api.test.issueflow.dev',
        }),
      ],
    });
    
    service = TestBed.inject(IssueFlowService);
  });
  
  it('should submit feedback', async () => {
    spyOn(service, 'submitIssue').and.returnValue(
      Promise.resolve({ issue: { id: '1' }, success: true })
    );
    
    const result = await service.submitIssue({
      title: 'Test',
      description: 'Test feedback',
      type: 'feedback',
    });
    
    expect(result.success).toBe(true);
  });
});
```

### E2E Testing

```typescript
// cypress/integration/feedback.spec.ts
describe('Feedback Widget', () => {
  it('should open and submit feedback', () => {
    cy.visit('/');
    
    // Open widget
    cy.get('[data-cy="feedback-trigger"]').click();
    
    // Fill form
    cy.get('[data-cy="feedback-title"]').type('Great app!');
    cy.get('[data-cy="feedback-description"]').type('I love the new features.');
    cy.get('[data-cy="feedback-type"]').select('feedback');
    
    // Submit
    cy.get('[data-cy="feedback-submit"]').click();
    
    // Verify success
    cy.get('[data-cy="feedback-success"]').should('be.visible');
  });
});
```

## 🔧 Advanced Configuration

### Environment-based Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  issueflow: {
    projectId: 'dev-project-id',
    apiUrl: 'https://api.dev.issueflow.dev',
    debug: true,
  },
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  issueflow: {
    projectId: 'prod-project-id',
    apiUrl: 'https://api.issueflow.dev',
    debug: false,
  },
};

// app.module.ts
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    IssueFlowModule.forRoot(environment.issueflow),
  ],
})
export class AppModule {}
```

### Custom Validators

```typescript
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { IssueFlowValidators } from '@issueflow/angular';

@Component({
  selector: 'app-custom-feedback-form',
  template: `
    <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
      <input
        formControlName="title"
        placeholder="Issue title"
      />
      <div *ngIf="feedbackForm.get('title')?.invalid && feedbackForm.get('title')?.touched">
        {{ getErrorMessage('title', feedbackForm.get('title')?.errors!) }}
      </div>
      
      <textarea
        formControlName="description"
        placeholder="Describe the issue"
      ></textarea>
      
      <button type="submit" [disabled]="feedbackForm.invalid">
        Submit
      </button>
    </form>
  `,
})
export class CustomFeedbackFormComponent {
  feedbackForm = this.fb.group({
    title: ['', [Validators.required, IssueFlowValidators.issueTitle]],
    description: ['', [Validators.required, IssueFlowValidators.issueDescription]],
  });

  constructor(private fb: FormBuilder) {}

  getErrorMessage(fieldName: string, errors: any): string {
    return IssueFlowValidators.getErrorMessage(fieldName, errors);
  }

  onSubmit() {
    if (this.feedbackForm.valid) {
      // Submit logic
    }
  }
}
```

## 📚 API Reference

### Components

#### `IssueFlowWidgetComponent`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `IssueFlowConfig` | - | Widget configuration |
| `position` | `WidgetPosition` | `'bottom-right'` | Widget position |
| `disabled` | `boolean` | `false` | Disable widget |
| `hidden` | `boolean` | `false` | Hide widget |

| Output | Type | Description |
|--------|------|-------------|
| `issueSubmitted` | `IssueSubmissionResult` | Emitted when issue is submitted |
| `widgetOpened` | `void` | Emitted when widget opens |
| `widgetClosed` | `void` | Emitted when widget closes |
| `error` | `Error` | Emitted on errors |

### Services

#### `IssueFlowService`

| Method | Return Type | Description |
|--------|-------------|-------------|
| `initialize(config)` | `Promise<void>` | Initialize service |
| `submitIssue(issue)` | `Promise<IssueSubmissionResult>` | Submit an issue |
| `loadIssues(filters?)` | `Promise<Issue[]>` | Load issues |
| `updateConfig(config)` | `void` | Update configuration |

| Property | Type | Description |
|----------|------|-------------|
| `config$` | `Observable<IssueFlowConfig>` | Configuration observable |
| `loading$` | `Observable<boolean>` | Loading state |
| `error$` | `Observable<Error>` | Error state |
| `issues$` | `Observable<Issue[]>` | Issues list |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/issueflow/issueflow.git
cd issueflow

# Install dependencies
npm install

# Build the Angular adapter
npm run build:angular

# Run tests
npm run test:angular

# Start development
npm run dev:angular
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Links

- [Documentation](https://docs.issueflow.dev)
- [Angular Integration Guide](https://docs.issueflow.dev/frameworks/angular)
- [API Reference](https://docs.issueflow.dev/api)
- [Discord Community](https://discord.gg/issueflow)
- [GitHub Issues](https://github.com/issueflow/issueflow/issues)

---

Made with ❤️ by the [IssueFlow Team](https://issueflow.dev)
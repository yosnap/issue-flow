/**
 * @fileoverview IssueFlow Widget Component
 * 
 * Main widget component for Angular providing feedback collection UI.
 * Includes trigger button, modal dialog, and form functionality.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  HostBinding,
  ElementRef,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { IssueFlowService } from '../services/issue-flow.service';
import type {
  IssueFlowConfig,
  Issue,
  IssueSubmissionResult,
} from '@issueflow/sdk';
import type {
  IssueFlowWidgetInputs,
  IssueFlowWidgetOutputs,
} from '../types';

/**
 * IssueFlow Widget Component
 */
@Component({
  selector: 'if-widget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Widget Trigger -->
    <button
      *ngIf="!isModalOpen"
      class="if-widget-trigger"
      [class]="triggerClasses"
      [disabled]="disabled"
      [hidden]="hidden"
      (click)="openWidget()"
      [attr.aria-label]="triggerText"
      type="button"
    >
      <span class="if-trigger-icon" [innerHTML]="triggerIcon"></span>
      <span class="if-trigger-text">{{ triggerText }}</span>
    </button>

    <!-- Widget Modal -->
    <div
      *ngIf="isModalOpen"
      class="if-widget-overlay"
      [class]="overlayClasses"
      (click)="onOverlayClick($event)"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="modalTitleId"
    >
      <div class="if-widget-modal" [class]="modalClasses" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <header class="if-modal-header">
          <h2 [id]="modalTitleId" class="if-modal-title">{{ modalTitle }}</h2>
          <button
            class="if-modal-close"
            (click)="closeWidget()"
            aria-label="Close feedback form"
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        <!-- Modal Body -->
        <div class="if-modal-body">
          <!-- Loading State -->
          <div *ngIf="isLoading" class="if-loading">
            <div class="if-spinner"></div>
            <p>{{ loadingText }}</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error && !isLoading" class="if-error">
            <div class="if-error-icon">⚠️</div>
            <div class="if-error-content">
              <h3>Something went wrong</h3>
              <p>{{ error.message }}</p>
              <button class="if-retry-btn" (click)="clearError()" type="button">
                Try Again
              </button>
            </div>
          </div>

          <!-- Success State -->
          <div *ngIf="isSuccess && !isLoading" class="if-success">
            <div class="if-success-icon">✅</div>
            <div class="if-success-content">
              <h3>Thank you!</h3>
              <p>{{ successMessage }}</p>
              <button class="if-success-btn" (click)="resetForm()" type="button">
                Send Another
              </button>
            </div>
          </div>

          <!-- Form -->
          <form
            *ngIf="!isLoading && !error && !isSuccess"
            [formGroup]="feedbackForm"
            (ngSubmit)="onSubmit()"
            class="if-feedback-form"
          >
            <!-- Issue Type -->
            <div class="if-field-group">
              <label for="issueType" class="if-label">Type</label>
              <select
                id="issueType"
                formControlName="type"
                class="if-select"
                required
              >
                <option value="feedback">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="question">Question</option>
              </select>
            </div>

            <!-- Priority -->
            <div class="if-field-group">
              <label for="priority" class="if-label">Priority</label>
              <select
                id="priority"
                formControlName="priority"
                class="if-select"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <!-- Title -->
            <div class="if-field-group">
              <label for="title" class="if-label">Title *</label>
              <input
                id="title"
                formControlName="title"
                type="text"
                class="if-input"
                placeholder="Brief description of your feedback"
                required
              />
              <div *ngIf="feedbackForm.get('title')?.invalid && feedbackForm.get('title')?.touched" class="if-field-error">
                Title is required
              </div>
            </div>

            <!-- Description -->
            <div class="if-field-group">
              <label for="description" class="if-label">Description *</label>
              <textarea
                id="description"
                formControlName="description"
                class="if-textarea"
                placeholder="Please provide detailed information..."
                rows="4"
                required
              ></textarea>
              <div *ngIf="feedbackForm.get('description')?.invalid && feedbackForm.get('description')?.touched" class="if-field-error">
                Description is required
              </div>
            </div>

            <!-- Email (if required) -->
            <div *ngIf="requireEmail" class="if-field-group">
              <label for="email" class="if-label">Email *</label>
              <input
                id="email"
                formControlName="email"
                type="email"
                class="if-input"
                placeholder="your@email.com"
                required
              />
              <div *ngIf="feedbackForm.get('email')?.invalid && feedbackForm.get('email')?.touched" class="if-field-error">
                <span *ngIf="feedbackForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="feedbackForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <!-- File Attachments (premium feature) -->
            <div *ngIf="allowFileUploads" class="if-field-group">
              <label class="if-label">Attachments</label>
              <div class="if-file-upload">
                <input
                  #fileInput
                  type="file"
                  multiple
                  (change)="onFileSelect($event)"
                  class="if-file-input"
                  [accept]="allowedFileTypes?.join(',')"
                />
                <button
                  type="button"
                  class="if-file-button"
                  (click)="fileInput.click()"
                >
                  Choose Files
                </button>
                <div *ngIf="selectedFiles.length > 0" class="if-file-list">
                  <div *ngFor="let file of selectedFiles" class="if-file-item">
                    <span class="if-file-name">{{ file.name }}</span>
                    <button
                      type="button"
                      class="if-file-remove"
                      (click)="removeFile(file)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="if-form-actions">
              <button
                type="button"
                class="if-btn if-btn-secondary"
                (click)="closeWidget()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="if-btn if-btn-primary"
                [disabled]="feedbackForm.invalid || isSubmitting"
              >
                {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <footer class="if-modal-footer">
          <p class="if-powered-by">
            Powered by <a href="https://issueflow.dev" target="_blank">IssueFlow</a>
          </p>
        </footer>
      </div>
    </div>
  `,
  styleUrls: ['./issue-flow-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class IssueFlowWidgetComponent implements OnInit, OnDestroy, IssueFlowWidgetInputs, IssueFlowWidgetOutputs {
  // Inputs
  @Input() config?: IssueFlowConfig;
  @Input() position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = 'bottom-right';
  @Input() cssClass?: string;
  @Input() disabled = false;
  @Input() hidden = false;
  @Input() theme?: any;

  // Outputs
  @Output() issueSubmitted = new EventEmitter<IssueSubmissionResult>();
  @Output() widgetOpened = new EventEmitter<void>();
  @Output() widgetClosed = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();
  @Output() configChanged = new EventEmitter<IssueFlowConfig>();

  // Component state
  isModalOpen = false;
  isLoading = false;
  isSubmitting = false;
  isSuccess = false;
  error: Error | null = null;
  selectedFiles: File[] = [];

  // Form
  feedbackForm: FormGroup;

  // Configuration
  triggerText = 'Feedback';
  triggerIcon = '💬';
  modalTitle = 'Send Feedback';
  loadingText = 'Sending your feedback...';
  successMessage = 'Your feedback has been sent successfully!';
  modalTitleId = `if-modal-title-${Math.random().toString(36).substr(2, 9)}`;

  // Feature flags from config
  requireEmail = false;
  allowFileUploads = false;
  allowedFileTypes: string[] = [];

  private destroy$ = new Subject<void>();

  @HostBinding('class') get hostClasses(): string {
    return [
      'if-widget',
      `if-position-${this.position}`,
      this.cssClass || '',
      this.disabled ? 'if-disabled' : '',
      this.hidden ? 'if-hidden' : '',
    ].filter(Boolean).join(' ');
  }

  get triggerClasses(): string {
    return [
      'if-widget-trigger',
      `if-position-${this.position}`,
      this.disabled ? 'if-disabled' : '',
    ].filter(Boolean).join(' ');
  }

  get overlayClasses(): string {
    return ['if-widget-overlay', this.isModalOpen ? 'if-open' : ''].filter(Boolean).join(' ');
  }

  get modalClasses(): string {
    return ['if-widget-modal', `if-theme-${this.theme?.mode || 'auto'}`].filter(Boolean).join(' ');
  }

  constructor(
    private formBuilder: FormBuilder,
    private issueFlowService: IssueFlowService,
    private elementRef: ElementRef
  ) {
    this.feedbackForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Initialize with config if provided
    if (this.config) {
      this.applyConfiguration(this.config);
    }

    // Listen to service configuration changes
    this.issueFlowService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        if (config) {
          this.applyConfiguration(config);
        }
      });

    // Listen to service loading state
    this.issueFlowService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Listen to service errors
    this.issueFlowService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        if (error) {
          this.error.emit(error);
        }
      });
  }

  private setupEventListeners(): void {
    // Listen for escape key
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      type: ['feedback', Validators.required],
      priority: ['medium', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      email: [''],
    });
  }

  private applyConfiguration(config: IssueFlowConfig): void {
    // Update component properties based on config
    this.triggerText = config.widget?.triggerText || 'Feedback';
    this.requireEmail = config.behavior?.requireEmail || false;
    this.allowFileUploads = config.behavior?.allowFileUploads || false;
    this.allowedFileTypes = config.behavior?.allowedFileTypes || [];

    // Update form validators
    if (this.requireEmail) {
      this.feedbackForm.get('email')?.setValidators([Validators.required, Validators.email]);
    } else {
      this.feedbackForm.get('email')?.clearValidators();
    }
    this.feedbackForm.get('email')?.updateValueAndValidity();

    // Apply theme
    if (config.theme) {
      this.applyTheme(config.theme);
    }
  }

  private applyTheme(theme: any): void {
    const element = this.elementRef.nativeElement;
    
    // Apply CSS custom properties
    if (theme.primaryColor) {
      element.style.setProperty('--if-primary-color', theme.primaryColor);
    }
    if (theme.borderRadius) {
      element.style.setProperty('--if-border-radius', `${theme.borderRadius}px`);
    }
  }

  openWidget(): void {
    if (this.disabled) return;

    this.isModalOpen = true;
    this.resetState();
    this.widgetOpened.emit();
    this.issueFlowService.onWidgetOpened();

    // Focus first input
    setTimeout(() => {
      const firstInput = this.elementRef.nativeElement.querySelector('.if-input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeWidget(): void {
    this.isModalOpen = false;
    this.resetState();
    this.widgetClosed.emit();
    this.issueFlowService.onWidgetClosed();
  }

  async onSubmit(): Promise<void> {
    if (this.feedbackForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.clearError();

    try {
      const formData = this.feedbackForm.value;
      
      const issueData: Partial<Issue> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        metadata: {
          source: 'angular-widget',
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          email: formData.email || undefined,
        },
      };

      const result = await this.issueFlowService.submitIssue(issueData);
      
      this.isSuccess = true;
      this.issueSubmitted.emit(result);

      // Auto-close after delay if configured
      const config = this.issueFlowService.getConfig();
      if (config?.behavior?.autoClose) {
        setTimeout(() => {
          this.closeWidget();
        }, config.behavior.autoCloseDelay || 3000);
      }

    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Failed to submit feedback');
      this.error.emit(this.error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.selectedFiles = Array.from(target.files);
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  onOverlayClick(event: MouseEvent): void {
    // Close modal when clicking overlay (not the modal itself)
    if (event.target === event.currentTarget) {
      this.closeWidget();
    }
  }

  resetForm(): void {
    this.feedbackForm.reset({
      type: 'feedback',
      priority: 'medium',
      title: '',
      description: '',
      email: '',
    });
    this.selectedFiles = [];
    this.isSuccess = false;
  }

  resetState(): void {
    this.isSubmitting = false;
    this.isSuccess = false;
    this.clearError();
    
    if (!this.isModalOpen) {
      this.resetForm();
    }
  }

  clearError(): void {
    this.error = null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isModalOpen) {
      this.closeWidget();
    }
  }
}
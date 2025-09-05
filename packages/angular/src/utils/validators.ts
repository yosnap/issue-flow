/**
 * @fileoverview Angular Form Validators
 * 
 * Custom validators for Angular reactive forms used in IssueFlow components.
 * Provides validation for feedback forms and configuration.
 */

import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/**
 * IssueFlow-specific form validators
 */
export class IssueFlowValidators {
  /**
   * Validate issue title
   */
  static issueTitle(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return { required: true };
    }
    
    if (value.length < 3) {
      return { minLength: { requiredLength: 3, actualLength: value.length } };
    }
    
    if (value.length > 200) {
      return { maxLength: { requiredLength: 200, actualLength: value.length } };
    }
    
    // Check for potentially harmful content
    if (/<script|javascript:|data:/i.test(value)) {
      return { unsafe: true };
    }
    
    return null;
  }

  /**
   * Validate issue description
   */
  static issueDescription(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return { required: true };
    }
    
    if (value.length < 10) {
      return { minLength: { requiredLength: 10, actualLength: value.length } };
    }
    
    if (value.length > 5000) {
      return { maxLength: { requiredLength: 5000, actualLength: value.length } };
    }
    
    // Check for potentially harmful content
    if (/<script|javascript:|data:/i.test(value)) {
      return { unsafe: true };
    }
    
    return null;
  }

  /**
   * Validate project ID format
   */
  static projectId(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return { required: true };
    }
    
    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
      return { 
        pattern: { 
          requiredPattern: '^[a-zA-Z0-9-_]+$',
          actualValue: value 
        } 
      };
    }
    
    if (value.length < 3) {
      return { minLength: { requiredLength: 3, actualLength: value.length } };
    }
    
    if (value.length > 50) {
      return { maxLength: { requiredLength: 50, actualLength: value.length } };
    }
    
    return null;
  }

  /**
   * Validate API URL format
   */
  static apiUrl(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return { required: true };
    }
    
    try {
      const url = new URL(value);
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { protocol: { allowedProtocols: ['http', 'https'] } };
      }
      
      if (!url.hostname) {
        return { hostname: true };
      }
      
      return null;
    } catch {
      return { url: true };
    }
  }

  /**
   * Validate organization slug format
   */
  static organizationSlug(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    // Organization slug is optional
    if (!value) {
      return null;
    }
    
    if (!/^[a-z0-9-]+$/.test(value)) {
      return { 
        pattern: { 
          requiredPattern: '^[a-z0-9-]+$',
          actualValue: value 
        } 
      };
    }
    
    if (value.length < 2) {
      return { minLength: { requiredLength: 2, actualLength: value.length } };
    }
    
    if (value.length > 50) {
      return { maxLength: { requiredLength: 50, actualLength: value.length } };
    }
    
    return null;
  }

  /**
   * Validate email format (stricter than built-in email validator)
   */
  static strictEmail(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return null; // Let required validator handle empty values
    }
    
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(value)) {
      return { email: true };
    }
    
    if (value.length > 254) {
      return { maxLength: { requiredLength: 254, actualLength: value.length } };
    }
    
    return null;
  }

  /**
   * Validate file upload
   */
  static fileUpload(allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const files = control.value as FileList | File[] | null;
      
      if (!files || files.length === 0) {
        return null;
      }
      
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      const errors: any = {};
      
      for (const file of fileArray) {
        // Check file size
        if (file.size > maxSize) {
          errors.fileSize = {
            maxSize,
            actualSize: file.size,
            fileName: file.name,
          };
          break;
        }
        
        // Check file type
        if (allowedTypes.length > 0) {
          const isAllowed = allowedTypes.some(type => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            } else if (type.includes('*')) {
              const [mimeType] = type.split('/');
              return file.type.startsWith(`${mimeType}/`);
            } else {
              return file.type === type;
            }
          });
          
          if (!isAllowed) {
            errors.fileType = {
              allowedTypes,
              actualType: file.type,
              fileName: file.name,
            };
            break;
          }
        }
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validate color hex format
   */
  static hexColor(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    
    if (!value) {
      return null; // Optional field
    }
    
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (!hexColorRegex.test(value)) {
      return { hexColor: { actualValue: value } };
    }
    
    return null;
  }

  /**
   * Validate numeric range
   */
  static numericRange(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (value === null || value === undefined || value === '') {
        return null; // Let required validator handle empty values
      }
      
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return { number: true };
      }
      
      if (numValue < min) {
        return { min: { min, actual: numValue } };
      }
      
      if (numValue > max) {
        return { max: { max, actual: numValue } };
      }
      
      return null;
    };
  }

  /**
   * Validate configuration object
   */
  static configurationForm(form: FormGroup): ValidationErrors | null {
    if (!form) {
      return null;
    }
    
    const errors: any = {};
    
    // Cross-field validation
    const projectId = form.get('projectId')?.value;
    const apiUrl = form.get('apiUrl')?.value;
    
    // If API URL is a development/test URL, project ID can be more flexible
    if (apiUrl && (apiUrl.includes('dev.') || apiUrl.includes('test.'))) {
      // More lenient validation for development
    } else if (projectId && apiUrl) {
      // Production validation - ensure project ID matches expected format
      if (projectId.includes('test') || projectId.includes('dev')) {
        errors.productionMismatch = true;
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Async validator for project ID availability (example)
   */
  static projectIdAvailability(issueFlowService: any): ValidatorFn {
    return (control: AbstractControl): Promise<ValidationErrors | null> => {
      const value = control.value?.trim();
      
      if (!value) {
        return Promise.resolve(null);
      }
      
      // Simulate API call to check availability
      return new Promise(resolve => {
        setTimeout(() => {
          // This would be replaced with actual API call
          const unavailableIds = ['admin', 'api', 'www', 'test'];
          
          if (unavailableIds.includes(value.toLowerCase())) {
            resolve({ unavailable: true });
          } else {
            resolve(null);
          }
        }, 500);
      });
    };
  }

  /**
   * Custom error messages for validation errors
   */
  static getErrorMessage(fieldName: string, error: ValidationErrors): string {
    const errorKey = Object.keys(error)[0];
    const errorValue = error[errorKey];
    
    switch (errorKey) {
      case 'required':
        return `${fieldName} is required`;
      
      case 'minLength':
        return `${fieldName} must be at least ${errorValue.requiredLength} characters`;
      
      case 'maxLength':
        return `${fieldName} must be no more than ${errorValue.requiredLength} characters`;
      
      case 'email':
        return 'Please enter a valid email address';
      
      case 'pattern':
        return `${fieldName} format is invalid`;
      
      case 'url':
        return 'Please enter a valid URL';
      
      case 'hexColor':
        return 'Please enter a valid hex color (e.g., #FF0000)';
      
      case 'number':
        return `${fieldName} must be a valid number`;
      
      case 'min':
        return `${fieldName} must be at least ${errorValue.min}`;
      
      case 'max':
        return `${fieldName} must be no more than ${errorValue.max}`;
      
      case 'fileSize':
        return `File "${errorValue.fileName}" is too large. Maximum size is ${this.formatFileSize(errorValue.maxSize)}`;
      
      case 'fileType':
        return `File "${errorValue.fileName}" type is not allowed. Allowed types: ${errorValue.allowedTypes.join(', ')}`;
      
      case 'unsafe':
        return `${fieldName} contains potentially unsafe content`;
      
      case 'unavailable':
        return `${fieldName} is not available`;
      
      case 'productionMismatch':
        return 'Configuration appears to mix development and production settings';
      
      default:
        return `${fieldName} is invalid`;
    }
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
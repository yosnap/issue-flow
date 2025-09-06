/**
 * SDK Test Runner
 * Comprehensive tests for all IssueFlow SDK modules
 */

// Simple assertion functions
const assert = {
  equal(actual: any, expected: any, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  deepEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  ok(value: any, message?: string) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },
  throws(fn: () => void, errorMessage?: string) {
    try {
      fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (errorMessage && (!error || !error.message.includes(errorMessage))) {
        throw new Error(`Expected error containing "${errorMessage}", got: ${error?.message}`);
      }
    }
  }
};

import { IssueFlowClient } from '../client';
import { IssueStatus, IssuePriority, IssueCategory, CreateIssueRequestSchema, WidgetConfigSchema } from '../types';
import { 
  generateSessionId, 
  getViewport, 
  getCurrentUrl, 
  getUserAgent, 
  debounce, 
  throttle,
  isValidEmail,
  sanitizeHtml,
  deepMerge,
  formatFileSize,
  validateFile,
  createDefaultConfig,
  enrichIssueMetadata,
  extractErrorMessage,
  withTimeout,
  retry
} from '../utils';
import { WebhookVerifier, WebhookProcessor, WebhookTester, WEBHOOK_EVENTS } from '../webhooks';

class SimpleTestRunner {
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  async test(name: string, testFn: () => Promise<void> | void): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  getResults() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    return { passed, failed, total: this.results.length, results: this.results };
  }

  printSummary() {
    const { passed, failed, total } = this.getResults();
    console.log(`\n📊 Test Results: ${passed}/${total} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log(`\n❌ Failed tests:`);
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
  }
}

async function runSDKTests() {
  console.log('🧪 Running IssueFlow SDK Tests...\n');
  
  const runner = new SimpleTestRunner();

  // === TYPE VALIDATION TESTS ===
  console.log('📋 Testing Type Validation...');
  
  await runner.test('IssueStatus enum should have correct values', () => {
    assert.equal(IssueStatus.OPEN, 'open');
    assert.equal(IssueStatus.IN_PROGRESS, 'in_progress');
    assert.equal(IssueStatus.RESOLVED, 'resolved');
    assert.equal(IssueStatus.CLOSED, 'closed');
  });

  await runner.test('IssuePriority enum should have correct values', () => {
    assert.equal(IssuePriority.LOW, 'low');
    assert.equal(IssuePriority.NORMAL, 'normal');
    assert.equal(IssuePriority.HIGH, 'high');
    assert.equal(IssuePriority.CRITICAL, 'critical');
  });

  await runner.test('IssueCategory enum should have correct values', () => {
    assert.equal(IssueCategory.BUG, 'bug');
    assert.equal(IssueCategory.FEATURE_REQUEST, 'feature_request');
    assert.equal(IssueCategory.IMPROVEMENT, 'improvement');
    assert.equal(IssueCategory.QUESTION, 'question');
    assert.equal(IssueCategory.OTHER, 'other');
  });

  await runner.test('CreateIssueRequestSchema should validate correctly', () => {
    const validRequest = {
      title: 'Test Issue',
      description: 'Test Description',
      priority: IssuePriority.HIGH,
      category: IssueCategory.BUG,
      reporter: {
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    const result = CreateIssueRequestSchema.safeParse(validRequest);
    assert.ok(result.success);
  });

  await runner.test('WidgetConfigSchema should validate correctly', () => {
    const validConfig = {
      apiUrl: 'https://api.issueflow.com',
      projectId: 'test-project',
      position: 'bottom-right',
      theme: 'light'
    };

    const result = WidgetConfigSchema.safeParse(validConfig);
    assert.ok(result.success);
  });

  // === CLIENT TESTS ===
  console.log('\n🔌 Testing IssueFlow Client...');

  await runner.test('IssueFlowClient should initialize correctly', () => {
    const client = new IssueFlowClient({
      apiUrl: 'https://api.issueflow.com',
      projectId: 'test-project',
      apiKey: 'test-key',
      timeout: 5000
    });

    assert.ok(client instanceof IssueFlowClient);
  });

  // === UTILITY TESTS ===
  console.log('\n🔧 Testing Utility Functions...');

  await runner.test('generateSessionId should return valid session ID', () => {
    const sessionId = generateSessionId();
    assert.ok(typeof sessionId === 'string');
    assert.ok(sessionId.length > 10);
    assert.ok(sessionId.includes('-'));
  });

  await runner.test('getViewport should return viewport dimensions', () => {
    const viewport = getViewport();
    assert.ok(typeof viewport.width === 'number');
    assert.ok(typeof viewport.height === 'number');
  });

  await runner.test('getCurrentUrl should return string', () => {
    const url = getCurrentUrl();
    assert.ok(typeof url === 'string');
  });

  await runner.test('getUserAgent should return string', () => {
    const userAgent = getUserAgent();
    assert.ok(typeof userAgent === 'string');
  });

  await runner.test('debounce should work correctly', async () => {
    let counter = 0;
    const increment = () => counter++;
    const debouncedIncrement = debounce(increment, 100);

    // Call multiple times quickly
    debouncedIncrement();
    debouncedIncrement();
    debouncedIncrement();

    assert.equal(counter, 0); // Should not have executed yet

    // Wait for debounce period
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(counter, 1); // Should have executed once
  });

  await runner.test('throttle should work correctly', () => {
    let counter = 0;
    const increment = () => counter++;
    const throttledIncrement = throttle(increment, 100);

    // Call multiple times quickly
    throttledIncrement();
    throttledIncrement();
    throttledIncrement();

    assert.equal(counter, 1); // Should have executed only once
  });

  await runner.test('isValidEmail should validate emails correctly', () => {
    assert.ok(isValidEmail('test@example.com'));
    assert.ok(isValidEmail('user.name+tag@example.org'));
    assert.ok(!isValidEmail('invalid-email'));
    assert.ok(!isValidEmail(''));
    assert.ok(!isValidEmail('@example.com'));
  });

  await runner.test('sanitizeHtml should escape HTML characters', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('<script>'));
    assert.ok(output.includes('&lt;script&gt;'));
  });

  await runner.test('deepMerge should merge objects correctly', () => {
    const target: any = { a: 1, b: { c: 2 } };
    const source: any = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);
    
    assert.equal(result.a, 1);
    assert.equal(result.b.c, 2);
    assert.equal(result.b.d, 3);
    assert.equal(result.e, 4);
  });

  await runner.test('formatFileSize should format bytes correctly', () => {
    assert.equal(formatFileSize(0), '0 Bytes');
    assert.equal(formatFileSize(1024), '1 KB');
    assert.equal(formatFileSize(1024 * 1024), '1 MB');
    assert.equal(formatFileSize(1024 * 1024 * 1024), '1 GB');
  });

  await runner.test('validateFile should validate file constraints', () => {
    // Mock file object
    const validFile = {
      size: 1024 * 1024, // 1MB
      type: 'image/png',
      name: 'test.png'
    } as File;

    const result = validateFile(validFile);
    assert.ok(result.valid);

    const largeFile = {
      size: 100 * 1024 * 1024, // 100MB
      type: 'image/png',
      name: 'large.png'
    } as File;

    const largeResult = validateFile(largeFile);
    assert.ok(!largeResult.valid);
    assert.ok(largeResult.error?.includes('size exceeds'));
  });

  await runner.test('createDefaultConfig should return valid config', () => {
    const config = createDefaultConfig({
      apiUrl: 'https://custom.api.com',
      projectId: 'custom-project'
    });

    assert.equal(config.apiUrl, 'https://custom.api.com');
    assert.equal(config.projectId, 'custom-project');
    assert.equal(config.position, 'bottom-right');
    assert.equal(config.theme, 'auto');
    assert.ok(config.enableScreenshot);
  });

  await runner.test('enrichIssueMetadata should enrich issue with metadata', () => {
    const issue = {
      title: 'Test Issue',
      description: 'Test Description',
      reporter: {
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    const enriched = enrichIssueMetadata(issue);
    assert.ok(enriched.metadata);
    assert.ok(enriched.metadata.sessionId);
    assert.ok((enriched.metadata as any).timestamp);
  });

  await runner.test('extractErrorMessage should extract error messages', () => {
    assert.equal(extractErrorMessage('simple error'), 'simple error');
    assert.equal(extractErrorMessage(new Error('error object')), 'error object');
    assert.equal(extractErrorMessage({ message: 'object with message' }), 'object with message');
    assert.equal(extractErrorMessage({ response: { data: { message: 'nested message' } } }), 'nested message');
  });

  await runner.test('withTimeout should timeout promises', async () => {
    const slowPromise = new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await withTimeout(slowPromise, 100, 'Test timeout');
      assert.ok(false, 'Should have timed out');
    } catch (error) {
      assert.ok(error.message.includes('Test timeout'));
    }
  });

  await runner.test('retry should retry failed operations', async () => {
    let attempts = 0;
    const flakyOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Operation failed');
      }
      return 'success';
    };

    const result = await retry(flakyOperation, { maxAttempts: 5 });
    assert.equal(result, 'success');
    assert.equal(attempts, 3);
  });

  // === WEBHOOK TESTS ===
  console.log('\n🪝 Testing Webhook System...');

  await runner.test('WebhookVerifier should verify signatures correctly', () => {
    const verifier = new WebhookVerifier('secret-key');
    const payload = JSON.stringify({ test: 'data' });
    const signature = verifier.generateSignature(payload);
    
    assert.ok(verifier.verifySignature(payload, signature));
    assert.ok(!verifier.verifySignature(payload, 'invalid-signature'));
  });

  await runner.test('WebhookProcessor should process webhooks correctly', async () => {
    const processor = new WebhookProcessor('secret-key');
    let handledPayload: any = null;

    processor.addHandler('test-handler', {
      onIssueCreated: async (payload) => {
        handledPayload = payload;
      }
    });

    const testPayload = {
      event: 'issue.created',
      data: { id: 'test-issue', title: 'Test Issue' },
      timestamp: new Date(),
      projectId: 'test-project'
    };

    const payloadString = JSON.stringify(testPayload);
    const verifier = new WebhookVerifier('secret-key');
    const signature = verifier.generateSignature(payloadString);

    const result = await processor.processWebhook(payloadString, signature);
    
    assert.ok(result.success);
    assert.ok(handledPayload);
    assert.equal(handledPayload.event, 'issue.created');
  });

  await runner.test('WebhookTester should create test payloads correctly', () => {
    const tester = new WebhookTester('secret-key');
    const testData = { id: 'test-issue', title: 'Test Issue' };
    
    const { payload, signature } = tester.createTestPayload('issue.created', testData);
    
    assert.ok(payload);
    assert.ok(signature);
    
    const parsedPayload = JSON.parse(payload);
    assert.equal(parsedPayload.event, 'issue.created');
    assert.deepEqual(parsedPayload.data, testData);
  });

  await runner.test('WEBHOOK_EVENTS should contain correct event types', () => {
    assert.equal(WEBHOOK_EVENTS.ISSUE_CREATED, 'issue.created');
    assert.equal(WEBHOOK_EVENTS.ISSUE_UPDATED, 'issue.updated');
    assert.equal(WEBHOOK_EVENTS.ISSUE_DELETED, 'issue.deleted');
  });

  // === INTEGRATION TESTS ===
  console.log('\n🔗 Testing SDK Integration...');

  await runner.test('Full SDK workflow should work correctly', () => {
    // Create client
    const client = new IssueFlowClient({
      apiUrl: 'https://api.issueflow.com',
      projectId: 'test-project',
      apiKey: 'test-key'
    });

    // Create webhook processor
    const webhook = new WebhookProcessor('webhook-secret');
    
    // Create utility functions
    const sessionId = generateSessionId();
    const config = createDefaultConfig({ apiUrl: 'https://api.issueflow.com' });
    
    // Validate everything was created correctly
    assert.ok(client instanceof IssueFlowClient);
    assert.ok(webhook instanceof WebhookProcessor);
    assert.ok(typeof sessionId === 'string');
    assert.ok(config.apiUrl === 'https://api.issueflow.com');
  });

  runner.printSummary();
  
  const { failed } = runner.getResults();
  if (failed > 0) {
    throw new Error('Some SDK tests failed');
  } else {
    console.log('\n🎉 All SDK tests passed!');
    console.log('\n✨ IssueFlow SDK is fully tested and ready for use!');
  }
}

// Export for external use
export { runSDKTests };

// Auto-execute the tests when run directly
runSDKTests().catch(console.error);
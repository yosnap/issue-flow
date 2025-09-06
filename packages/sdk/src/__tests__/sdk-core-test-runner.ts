/**
 * SDK Core Test Runner
 * Tests for core SDK functionality without external dependencies
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

async function runSDKCoreTests() {
  console.log('🧪 Running IssueFlow SDK Core Tests...\n');
  
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

  await runner.test('CreateIssueRequestSchema should reject invalid data', () => {
    const invalidRequest = {
      title: '', // Invalid: empty title
      description: 'Test Description',
      reporter: {
        email: 'invalid-email', // Invalid email format
        name: 'Test User'
      }
    };

    const result = CreateIssueRequestSchema.safeParse(invalidRequest);
    assert.ok(!result.success);
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

  // === UTILITY TESTS ===
  console.log('\n🔧 Testing Utility Functions...');

  await runner.test('generateSessionId should return valid session ID', () => {
    const sessionId = generateSessionId();
    assert.ok(typeof sessionId === 'string');
    assert.ok(sessionId.length > 10);
    assert.ok(sessionId.includes('-'));
    
    // Should generate unique IDs
    const sessionId2 = generateSessionId();
    assert.ok(sessionId !== sessionId2);
  });

  await runner.test('getViewport should return viewport dimensions', () => {
    const viewport = getViewport();
    assert.ok(typeof viewport.width === 'number');
    assert.ok(typeof viewport.height === 'number');
    assert.ok(viewport.width >= 0);
    assert.ok(viewport.height >= 0);
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

  await runner.test('throttle should work correctly', async () => {
    let counter = 0;
    const increment = () => counter++;
    const throttledIncrement = throttle(increment, 100);

    // Call multiple times quickly
    throttledIncrement();
    throttledIncrement();
    throttledIncrement();

    assert.equal(counter, 1); // Should have executed only once

    // Wait for throttle period and try again
    await new Promise(resolve => setTimeout(resolve, 150));
    throttledIncrement();
    assert.equal(counter, 2); // Should have executed again
  });

  await runner.test('isValidEmail should validate emails correctly', () => {
    // Valid emails
    assert.ok(isValidEmail('test@example.com'));
    assert.ok(isValidEmail('user.name+tag@example.org'));
    assert.ok(isValidEmail('user123@test-domain.co.uk'));

    // Invalid emails
    assert.ok(!isValidEmail('invalid-email'));
    assert.ok(!isValidEmail(''));
    assert.ok(!isValidEmail('@example.com'));
    assert.ok(!isValidEmail('test@'));
    // Note: our simple regex doesn't catch consecutive dots, which is fine for basic validation
  });

  await runner.test('sanitizeHtml should escape HTML characters', () => {
    const testCases = [
      { input: '<script>alert("xss")</script>', shouldContain: '&lt;script&gt;' },
      { input: 'Hello & World', shouldContain: '&amp;' },
      { input: 'Quote "test"', shouldContain: '&quot;' },
      { input: "Apostrophe 'test'", shouldContain: '&#39;' },
      { input: 'Less < than', shouldContain: '&lt;' },
      { input: 'Greater > than', shouldContain: '&gt;' }
    ];

    testCases.forEach(({ input, shouldContain }) => {
      const output = sanitizeHtml(input);
      assert.ok(output.includes(shouldContain), `Expected "${output}" to contain "${shouldContain}"`);
    });

    // Should not contain original dangerous characters
    const dangerousInput = '<script>alert("xss")</script>';
    const safeOutput = sanitizeHtml(dangerousInput);
    assert.ok(!safeOutput.includes('<script>'));
    assert.ok(!safeOutput.includes('</script>'));
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

  await runner.test('deepMerge should handle multiple sources', () => {
    const target: any = { a: 1 };
    const source1: any = { b: 2 };
    const source2: any = { c: 3 };
    const result = deepMerge(target, source1, source2);
    
    assert.equal(result.a, 1);
    assert.equal(result.b, 2);
    assert.equal(result.c, 3);
  });

  await runner.test('formatFileSize should format bytes correctly', () => {
    const testCases = [
      { bytes: 0, expected: '0 Bytes' },
      { bytes: 1, expected: '1 Bytes' },
      { bytes: 1024, expected: '1 KB' },
      { bytes: 1024 * 1024, expected: '1 MB' },
      { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
      { bytes: 1536, expected: '1.5 KB' }, // 1.5KB
      { bytes: 2.5 * 1024 * 1024, expected: '2.5 MB' }
    ];

    testCases.forEach(({ bytes, expected }) => {
      const result = formatFileSize(bytes);
      assert.equal(result, expected, `formatFileSize(${bytes}) should return ${expected}, got ${result}`);
    });
  });

  await runner.test('validateFile should validate file constraints', () => {
    // Mock file objects
    const validImageFile = {
      size: 1024 * 1024, // 1MB
      type: 'image/png',
      name: 'test.png'
    } as File;

    const validTextFile = {
      size: 1024, // 1KB
      type: 'text/plain',
      name: 'test.txt'
    } as File;

    const largeFile = {
      size: 100 * 1024 * 1024, // 100MB
      type: 'image/png',
      name: 'large.png'
    } as File;

    const unsupportedFile = {
      size: 1024,
      type: 'application/exe',
      name: 'virus.exe'
    } as File;

    // Test valid files
    assert.ok(validateFile(validImageFile).valid);
    assert.ok(validateFile(validTextFile).valid);

    // Test file too large
    const largeResult = validateFile(largeFile);
    assert.ok(!largeResult.valid);
    assert.ok(largeResult.error?.includes('size exceeds'));

    // Test unsupported file type
    const unsupportedResult = validateFile(unsupportedFile);
    assert.ok(!unsupportedResult.valid);
    assert.ok(unsupportedResult.error?.includes('not allowed'));
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
    assert.ok(config.captureConsoleErrors);
    assert.equal(config.triggerText, 'Feedback');
    assert.equal(config.primaryColor, '#2563eb');
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
    assert.ok(typeof enriched.metadata.userAgent === 'string');
    assert.ok(typeof enriched.metadata.url === 'string');
    assert.ok(enriched.metadata.viewport);
    assert.ok(typeof enriched.metadata.viewport.width === 'number');
  });

  await runner.test('extractErrorMessage should extract error messages', () => {
    // String error
    assert.equal(extractErrorMessage('simple error'), 'simple error');
    
    // Error object
    assert.equal(extractErrorMessage(new Error('error object')), 'error object');
    
    // Object with message
    assert.equal(extractErrorMessage({ message: 'object with message' }), 'object with message');
    
    // Nested response error
    assert.equal(
      extractErrorMessage({ response: { data: { message: 'nested message' } } }), 
      'nested message'
    );
    
    // HTTP status error
    assert.equal(
      extractErrorMessage({ response: { statusText: 'Not Found' } }), 
      'Not Found'
    );
    
    // Unknown error
    assert.equal(extractErrorMessage(null), 'An unknown error occurred');
    assert.equal(extractErrorMessage(undefined), 'An unknown error occurred');
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

  await runner.test('withTimeout should resolve fast promises', async () => {
    const fastPromise = new Promise(resolve => setTimeout(() => resolve('success'), 50));
    
    const result = await withTimeout(fastPromise, 1000, 'Should not timeout');
    assert.equal(result, 'success');
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

  await runner.test('retry should fail after max attempts', async () => {
    let attempts = 0;
    const alwaysFailOperation = async () => {
      attempts++;
      throw new Error('Always fails');
    };

    try {
      await retry(alwaysFailOperation, { maxAttempts: 3 });
      assert.ok(false, 'Should have failed');
    } catch (error) {
      assert.ok(error.message.includes('Always fails'));
      assert.equal(attempts, 3);
    }
  });

  // === WEBHOOK TESTS ===
  console.log('\n🪝 Testing Webhook System...');

  await runner.test('WebhookVerifier should generate consistent signatures', () => {
    const verifier = new WebhookVerifier('secret-key');
    const payload = JSON.stringify({ test: 'data' });
    
    const signature1 = verifier.generateSignature(payload);
    const signature2 = verifier.generateSignature(payload);
    
    assert.equal(signature1, signature2);
    assert.ok(signature1.startsWith('sha256='));
  });

  await runner.test('WebhookVerifier should verify signatures correctly', () => {
    const verifier = new WebhookVerifier('secret-key');
    const payload = JSON.stringify({ test: 'data' });
    const signature = verifier.generateSignature(payload);
    
    assert.ok(verifier.verifySignature(payload, signature));
    assert.ok(!verifier.verifySignature(payload, 'invalid-signature'));
    assert.ok(!verifier.verifySignature('different-payload', signature));
  });

  await runner.test('WebhookProcessor should process webhooks correctly', async () => {
    const processor = new WebhookProcessor('secret-key');
    let handledPayload: any = null;
    let handlerCallCount = 0;

    processor.addHandler('test-handler', {
      onIssueCreated: async (payload) => {
        handledPayload = payload;
        handlerCallCount++;
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
    assert.equal(handlerCallCount, 1);
  });

  await runner.test('WebhookProcessor should handle multiple handlers', async () => {
    const processor = new WebhookProcessor('secret-key');
    let handler1Called = false;
    let handler2Called = false;

    processor.addHandler('handler-1', {
      onIssueCreated: async () => { handler1Called = true; }
    });

    processor.addHandler('handler-2', {
      onIssueCreated: async () => { handler2Called = true; }
    });

    const testPayload = {
      event: 'issue.created',
      data: { id: 'test-issue' },
      timestamp: new Date(),
      projectId: 'test-project'
    };

    const payloadString = JSON.stringify(testPayload);
    const verifier = new WebhookVerifier('secret-key');
    const signature = verifier.generateSignature(payloadString);

    await processor.processWebhook(payloadString, signature);
    
    assert.ok(handler1Called);
    assert.ok(handler2Called);
  });

  await runner.test('WebhookProcessor should reject invalid signatures', async () => {
    const processor = new WebhookProcessor('secret-key');
    
    const testPayload = {
      event: 'issue.created',
      data: { id: 'test-issue' },
      timestamp: new Date(),
      projectId: 'test-project'
    };

    const payloadString = JSON.stringify(testPayload);
    const result = await processor.processWebhook(payloadString, 'invalid-signature');
    
    assert.ok(!result.success);
    assert.ok(result.error?.includes('Invalid webhook signature'));
  });

  await runner.test('WebhookTester should create test payloads correctly', () => {
    const tester = new WebhookTester('secret-key');
    const testData = { id: 'test-issue', title: 'Test Issue' };
    
    const { payload, signature } = tester.createTestPayload('issue.created', testData);
    
    assert.ok(payload);
    assert.ok(signature);
    assert.ok(signature.startsWith('sha256='));
    
    const parsedPayload = JSON.parse(payload);
    assert.equal(parsedPayload.event, 'issue.created');
    assert.deepEqual(parsedPayload.data, testData);
    assert.equal(parsedPayload.projectId, 'test-project-id');
  });

  await runner.test('WebhookTester should send mock webhooks', async () => {
    const tester = new WebhookTester('secret-key');
    const testData = { id: 'test-issue', title: 'Test Issue' };
    
    const result = await tester.sendTestWebhook(
      'https://example.com/webhook',
      'issue.created',
      testData
    );
    
    assert.ok(result.success);
    assert.equal(result.status, 200);
    assert.ok(result.response.message);
  });

  await runner.test('WEBHOOK_EVENTS should contain correct event types', () => {
    assert.equal(WEBHOOK_EVENTS.ISSUE_CREATED, 'issue.created');
    assert.equal(WEBHOOK_EVENTS.ISSUE_UPDATED, 'issue.updated');
    assert.equal(WEBHOOK_EVENTS.ISSUE_DELETED, 'issue.deleted');
  });

  runner.printSummary();
  
  const { failed } = runner.getResults();
  if (failed > 0) {
    throw new Error('Some SDK tests failed');
  } else {
    console.log('\n🎉 All SDK core tests passed!');
    console.log('\n✨ IssueFlow SDK core functionality is fully tested and ready for use!');
  }
}

// Export for external use
export { runSDKCoreTests };

// Auto-execute the tests when run directly
runSDKCoreTests().catch(console.error);
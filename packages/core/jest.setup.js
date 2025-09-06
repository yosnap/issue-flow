// Jest setup file
// Global test configuration and mocks

// Mock console methods by default to reduce test noise
// Individual tests can override these mocks if needed
const originalConsole = global.console;

beforeEach(() => {
  // Reset console mocks before each test
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
});

afterEach(() => {
  // Restore original console after each test
  global.console = originalConsole;
});

// Mock crypto for Node.js environment
const crypto = require('crypto');
global.crypto = crypto;

// Increase timeout for integration tests
jest.setTimeout(10000);
// Jest setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for tests

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleLog(...args);
  }
};

console.warn = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleWarn(...args);
  }
};

console.error = (...args) => {
  originalConsoleError(...args);
}; 
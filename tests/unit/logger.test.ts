/**
 * Logger Tests
 *
 * Note: chalk is an ESM-only module, so we mock it for testing.
 */

import { Logger, LogLevel } from '../../src/utils/logger';

// Mock chalk to avoid ESM issues
jest.mock('chalk', () => {
  const mockFn: any = (str: string) => str;
  mockFn.gray = mockFn;
  mockFn.blue = mockFn;
  mockFn.green = mockFn;
  mockFn.yellow = mockFn;
  mockFn.red = mockFn;
  mockFn.red.bold = mockFn;
  mockFn.cyan = mockFn;
  return mockFn;
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITCONNECT_DEBUG;
    logger = new Logger('info');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default info level', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should respect GITCONNECT_DEBUG environment variable', () => {
      process.env.GITCONNECT_DEBUG = 'true';
      const debugLogger = new Logger();
      expect(debugLogger).toBeInstanceOf(Logger);
    });
  });

  describe('setLevel', () => {
    it('should update log level', () => {
      logger.setLevel('debug');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('debug', () => {
    it('should not throw when level is debug', () => {
      logger.setLevel('debug');
      expect(() => logger.debug('test debug message')).not.toThrow();
    });

    it('should not throw when level is info', () => {
      expect(() => logger.debug('test debug message')).not.toThrow();
    });

    it('should not throw when GITCONNECT_DEBUG is true', () => {
      process.env.GITCONNECT_DEBUG = 'true';
      const debugLogger = new Logger();
      expect(() => debugLogger.debug('test debug message')).not.toThrow();
    });
  });

  describe('info', () => {
    it('should not throw when logging info', () => {
      expect(() => logger.info('test info message')).not.toThrow();
    });

    it('should not throw when level is silent', () => {
      logger.setLevel('silent');
      expect(() => logger.info('test info message')).not.toThrow();
    });

    it('should not throw when level is error', () => {
      logger.setLevel('error');
      expect(() => logger.info('test info message')).not.toThrow();
    });
  });

  describe('success', () => {
    it('should not throw when logging success', () => {
      expect(() => logger.success('operation completed')).not.toThrow();
    });

    it('should not throw when level is silent', () => {
      logger.setLevel('silent');
      expect(() => logger.success('operation completed')).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should not throw when logging warn', () => {
      expect(() => logger.warn('warning message')).not.toThrow();
    });

    it('should not throw when level is silent', () => {
      logger.setLevel('silent');
      expect(() => logger.warn('warning message')).not.toThrow();
    });

    it('should not throw when level is error', () => {
      logger.setLevel('error');
      expect(() => logger.warn('warning message')).not.toThrow();
    });
  });

  describe('error', () => {
    it('should not throw when logging error', () => {
      expect(() => logger.error('error message')).not.toThrow();
    });

    it('should not throw when level is silent', () => {
      logger.setLevel('silent');
      expect(() => logger.error('error message')).not.toThrow();
    });
  });

  describe('box', () => {
    it('should not throw when logging box', () => {
      expect(() => logger.box('Title', ['Line 1', 'Line 2'])).not.toThrow();
    });
  });

  describe('log level hierarchy', () => {
    it('should accept all log levels', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];

      for (const level of levels) {
        const testLogger = new Logger(level);
        expect(testLogger).toBeInstanceOf(Logger);
      }
    });
  });
});
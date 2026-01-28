import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel, logger, setLogLevel } from './logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
    setLogLevel(LogLevel.DEBUG);
  });

  describe('logger.debug', () => {
    it('DEBUGレベルでメッセージを出力する', () => {
      setLogLevel(LogLevel.DEBUG);
      logger.debug('test message');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    it('INFOレベルでは出力しない', () => {
      setLogLevel(LogLevel.INFO);
      logger.debug('test message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('logger.info', () => {
    it('INFOレベルでメッセージを出力する', () => {
      setLogLevel(LogLevel.INFO);
      logger.info('test message');
      expect(console.log).toHaveBeenCalledWith('[INFO]', 'test message');
    });

    it('WARNレベルでは出力しない', () => {
      setLogLevel(LogLevel.WARN);
      logger.info('test message');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('logger.warn', () => {
    it('WARNレベルでメッセージを出力する', () => {
      setLogLevel(LogLevel.WARN);
      logger.warn('test message');
      expect(console.warn).toHaveBeenCalledWith('[WARN]', 'test message');
    });

    it('ERRORレベルでは出力しない', () => {
      setLogLevel(LogLevel.ERROR);
      logger.warn('test message');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    it('ERRORレベルでメッセージを出力する', () => {
      setLogLevel(LogLevel.ERROR);
      logger.error('test message');
      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test message');
    });

    it('OFFレベルでは出力しない', () => {
      setLogLevel(LogLevel.OFF);
      logger.error('test message');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('複数の引数', () => {
    it('複数の引数を渡せる', () => {
      setLogLevel(LogLevel.INFO);
      logger.info('message', { key: 'value' }, 123);
      expect(console.log).toHaveBeenCalledWith('[INFO]', 'message', { key: 'value' }, 123);
    });
  });
});

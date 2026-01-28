// ログレベル
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4,
}

// 現在のログレベル（デフォルトは開発環境ではDEBUG、本番ではWARN）
let currentLogLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

// ログレベルを設定
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

// ログレベルを取得
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

// ロガー
export const logger = {
  debug: (...args: unknown[]): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args);
    }
  },
};

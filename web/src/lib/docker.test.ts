import { describe, expect, it } from 'vitest';
import { formatUptime } from './docker';

describe('formatUptime', () => {
  it('秒単位を正しくフォーマットする', () => {
    expect(formatUptime(30 * 1000)).toBe('30s');
    expect(formatUptime(1 * 1000)).toBe('1s');
  });

  it('分単位を正しくフォーマットする', () => {
    expect(formatUptime(5 * 60 * 1000)).toBe('5m');
    expect(formatUptime(30 * 60 * 1000)).toBe('30m');
  });

  it('時間単位を正しくフォーマットする', () => {
    expect(formatUptime(2 * 60 * 60 * 1000)).toBe('2h 0m');
    expect(formatUptime(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2h 30m');
  });

  it('日単位を正しくフォーマットする', () => {
    expect(formatUptime(1 * 24 * 60 * 60 * 1000)).toBe('1d 0h');
    expect(formatUptime(2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)).toBe('2d 5h');
  });

  it('0ミリ秒の場合', () => {
    expect(formatUptime(0)).toBe('0s');
  });
});

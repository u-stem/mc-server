import { describe, expect, it } from 'vitest';
import type { ServerSchedule } from '@/types';
import { isWithinSchedule, parseTime } from './scheduler';

describe('parseTime', () => {
  it('HH:MM形式の時刻を分に変換する', () => {
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('01:00')).toBe(60);
    expect(parseTime('12:30')).toBe(750);
    expect(parseTime('20:00')).toBe(1200);
    expect(parseTime('23:59')).toBe(1439);
  });

  it('24:00を1440分として扱う', () => {
    expect(parseTime('24:00')).toBe(1440);
  });

  it('無効な形式は-1を返す', () => {
    expect(parseTime('')).toBe(-1);
    expect(parseTime('invalid')).toBe(-1);
    expect(parseTime('25:00')).toBe(-1);
    expect(parseTime('12:60')).toBe(-1);
  });
});

describe('isWithinSchedule', () => {
  const baseSchedule: ServerSchedule = {
    enabled: true,
    timezone: 'Asia/Tokyo',
    weeklySchedule: {
      0: { enabled: true, startTime: '14:00', endTime: '22:00' }, // Sunday
      1: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Monday
      2: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Tuesday
      3: { enabled: true, startTime: '20:00', endTime: '23:00' }, // Wednesday
      4: { enabled: true, startTime: '20:00', endTime: '23:00' }, // Thursday
      5: { enabled: true, startTime: '20:00', endTime: '24:00' }, // Friday
      6: { enabled: true, startTime: '14:00', endTime: '24:00' }, // Saturday
    },
  };

  it('スケジュールが無効の場合はfalseを返す', () => {
    const disabledSchedule = { ...baseSchedule, enabled: false };
    // Wednesday 20:30 JST
    const date = new Date('2026-01-28T20:30:00+09:00');
    expect(isWithinSchedule(disabledSchedule, date)).toBe(false);
  });

  it('有効な曜日の稼働時間内はtrueを返す', () => {
    // Wednesday 20:30 JST
    const date = new Date('2026-01-28T20:30:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(true);
  });

  it('有効な曜日の稼働時間外はfalseを返す', () => {
    // Wednesday 19:00 JST (before start)
    const before = new Date('2026-01-28T19:00:00+09:00');
    expect(isWithinSchedule(baseSchedule, before)).toBe(false);

    // Wednesday 23:30 JST (after end)
    const after = new Date('2026-01-28T23:30:00+09:00');
    expect(isWithinSchedule(baseSchedule, after)).toBe(false);
  });

  it('無効な曜日はfalseを返す', () => {
    // Monday 20:30 JST (Monday is disabled)
    const date = new Date('2026-01-26T20:30:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(false);
  });

  it('開始時刻ちょうどはtrueを返す', () => {
    // Wednesday 20:00 JST
    const date = new Date('2026-01-28T20:00:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(true);
  });

  it('終了時刻ちょうどはfalseを返す', () => {
    // Wednesday 23:00 JST
    const date = new Date('2026-01-28T23:00:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(false);
  });

  it('24:00終了のスケジュールで23:59はtrueを返す', () => {
    // Friday 23:59 JST
    const date = new Date('2026-01-30T23:59:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(true);
  });

  it('日曜日のスケジュールが正しく適用される', () => {
    // Sunday 15:00 JST
    const date = new Date('2026-02-01T15:00:00+09:00');
    expect(isWithinSchedule(baseSchedule, date)).toBe(true);
  });

  describe('日をまたぐスケジュール', () => {
    const crossMidnightSchedule: ServerSchedule = {
      enabled: true,
      timezone: 'Asia/Tokyo',
      weeklySchedule: {
        0: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Sunday
        1: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Monday
        2: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Tuesday
        3: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Wednesday
        4: { enabled: true, startTime: '24:00', endTime: '01:00' }, // Thursday (24:00-01:00 = Fri 0:00-1:00)
        5: { enabled: false, startTime: '20:00', endTime: '23:00' }, // Friday
        6: { enabled: true, startTime: '22:00', endTime: '02:00' }, // Saturday (22:00-02:00)
      },
    };

    it('24:00開始のスケジュールが翌日0:00に適用される', () => {
      // Friday 00:30 JST (should match Thursday's 24:00-01:00)
      const date = new Date('2026-01-30T00:30:00+09:00');
      expect(isWithinSchedule(crossMidnightSchedule, date)).toBe(true);
    });

    it('24:00開始のスケジュールが終了時刻後は適用されない', () => {
      // Friday 01:30 JST (after Thursday's 24:00-01:00)
      const date = new Date('2026-01-30T01:30:00+09:00');
      expect(isWithinSchedule(crossMidnightSchedule, date)).toBe(false);
    });

    it('日をまたぐスケジュール（22:00-02:00）の開始時刻以降はtrue', () => {
      // Saturday 23:00 JST
      const date = new Date('2026-01-31T23:00:00+09:00');
      expect(isWithinSchedule(crossMidnightSchedule, date)).toBe(true);
    });

    it('日をまたぐスケジュール（22:00-02:00）の翌日部分もtrue', () => {
      // Sunday 01:00 JST (should match Saturday's 22:00-02:00)
      const date = new Date('2026-02-01T01:00:00+09:00');
      expect(isWithinSchedule(crossMidnightSchedule, date)).toBe(true);
    });

    it('日をまたぐスケジュール（22:00-02:00）の翌日終了後はfalse', () => {
      // Sunday 02:30 JST (after Saturday's 22:00-02:00)
      const date = new Date('2026-02-01T02:30:00+09:00');
      expect(isWithinSchedule(crossMidnightSchedule, date)).toBe(false);
    });
  });
});

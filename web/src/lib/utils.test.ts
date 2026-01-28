import { describe, expect, it } from 'vitest';
import { formatDate, formatFilename, formatSize, isJarFile } from './utils';

describe('formatSize', () => {
  it('バイト単位を正しくフォーマットする', () => {
    expect(formatSize(0)).toBe('0.0 B');
    expect(formatSize(500)).toBe('500.0 B');
    expect(formatSize(1023)).toBe('1023.0 B');
  });

  it('キロバイト単位を正しくフォーマットする', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(1024 * 1023)).toBe('1023.0 KB');
  });

  it('メガバイト単位を正しくフォーマットする', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatSize(1024 * 1024 * 50)).toBe('50.0 MB');
  });

  it('ギガバイト単位を正しくフォーマットする', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });

  it('GB を超えても GB 単位で表示する', () => {
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1024.0 GB');
  });
});

describe('formatDate', () => {
  it('ISO形式の日時を日本語形式にフォーマットする', () => {
    // タイムゾーンに依存するため、パターンマッチでテスト
    const result = formatDate('2024-01-15T10:30:00.000Z');
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it('異なる日時を正しくフォーマットする', () => {
    const result1 = formatDate('2023-12-25T00:00:00.000Z');
    const result2 = formatDate('2024-06-01T12:00:00.000Z');
    expect(result1).not.toBe(result2);
  });
});

describe('isJarFile', () => {
  it('.jar拡張子のファイルをtrueと判定する', () => {
    expect(isJarFile('example.jar')).toBe(true);
    expect(isJarFile('my-mod-1.0.0.jar')).toBe(true);
  });

  it('大文字小文字を区別しない', () => {
    expect(isJarFile('Example.JAR')).toBe(true);
    expect(isJarFile('test.Jar')).toBe(true);
  });

  it('.jar以外の拡張子はfalseと判定する', () => {
    expect(isJarFile('example.zip')).toBe(false);
    expect(isJarFile('example.txt')).toBe(false);
    expect(isJarFile('example.jar.disabled')).toBe(false);
  });

  it('拡張子がないファイルはfalseと判定する', () => {
    expect(isJarFile('noextension')).toBe(false);
    expect(isJarFile('jar')).toBe(false);
  });
});

describe('formatFilename', () => {
  it('.disabledを除去する', () => {
    expect(formatFilename('example.jar.disabled')).toBe('example.jar');
    expect(formatFilename('my-mod.jar.disabled')).toBe('my-mod.jar');
  });

  it('.disabledがないファイル名はそのまま返す', () => {
    expect(formatFilename('example.jar')).toBe('example.jar');
    expect(formatFilename('test.txt')).toBe('test.txt');
  });

  it('空文字列を処理できる', () => {
    expect(formatFilename('')).toBe('');
  });
});

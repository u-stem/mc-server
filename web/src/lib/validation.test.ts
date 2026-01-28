import { describe, expect, it } from 'vitest';
import {
  generateRandomPassword,
  isValidFileName,
  isValidPlayerName,
  isValidPort,
  isValidServerId,
  validateServerId,
} from './validation';

describe('isValidServerId', () => {
  it('"default" を有効と判定する', () => {
    expect(isValidServerId('default')).toBe(true);
  });

  it('有効な UUID v4 を受け入れる', () => {
    expect(isValidServerId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidServerId('6ba7b810-9dad-41d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('無効な UUID を拒否する', () => {
    expect(isValidServerId('not-a-uuid')).toBe(false);
    expect(isValidServerId('')).toBe(false);
    expect(isValidServerId('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // v3
  });

  it('UUID の大文字小文字を区別しない', () => {
    expect(isValidServerId('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });
});

describe('validateServerId', () => {
  it('有効な ID をそのまま返す', () => {
    expect(validateServerId('default')).toBe('default');
    expect(validateServerId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });

  it('無効な ID でエラーを投げる', () => {
    expect(() => validateServerId('invalid')).toThrow('Invalid server ID format');
  });
});

describe('isValidPlayerName', () => {
  it('有効なプレイヤー名を受け入れる', () => {
    expect(isValidPlayerName('Steve')).toBe(true);
    expect(isValidPlayerName('Player_123')).toBe(true);
    expect(isValidPlayerName('abc')).toBe(true); // 3文字（最小）
    expect(isValidPlayerName('abcdefghijklmnop')).toBe(true); // 16文字（最大）
  });

  it('短すぎる名前を拒否する', () => {
    expect(isValidPlayerName('ab')).toBe(false);
    expect(isValidPlayerName('')).toBe(false);
  });

  it('長すぎる名前を拒否する', () => {
    expect(isValidPlayerName('abcdefghijklmnopq')).toBe(false); // 17文字
  });

  it('無効な文字を含む名前を拒否する', () => {
    expect(isValidPlayerName('Player-Name')).toBe(false); // ハイフン
    expect(isValidPlayerName('Player Name')).toBe(false); // スペース
    expect(isValidPlayerName('Player@Name')).toBe(false); // 特殊文字
  });
});

describe('isValidPort', () => {
  it('有効なポート番号を受け入れる', () => {
    expect(isValidPort(1024)).toBe(true);
    expect(isValidPort(25565)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
  });

  it('範囲外のポート番号を拒否する', () => {
    expect(isValidPort(1023)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
  });

  it('整数でない値を拒否する', () => {
    expect(isValidPort(25565.5)).toBe(false);
    expect(isValidPort(NaN)).toBe(false);
  });
});

describe('isValidFileName', () => {
  it('有効なファイル名を受け入れる', () => {
    expect(isValidFileName('plugin.jar')).toBe(true);
    expect(isValidFileName('my-plugin_v1.0.jar')).toBe(true);
    expect(isValidFileName('Plugin123.jar')).toBe(true);
  });

  it('パストラバーサルを拒否する', () => {
    expect(isValidFileName('../etc/passwd')).toBe(false);
    expect(isValidFileName('..\\windows\\system32')).toBe(false);
    expect(isValidFileName('file..name')).toBe(false);
  });

  it('無効な文字を含むファイル名を拒否する', () => {
    expect(isValidFileName('file name.jar')).toBe(false); // スペース
    expect(isValidFileName('file/name.jar')).toBe(false); // スラッシュ
    expect(isValidFileName('')).toBe(false);
  });
});

describe('generateRandomPassword', () => {
  it('デフォルトで16文字のパスワードを生成する', () => {
    const password = generateRandomPassword();
    expect(password).toHaveLength(16);
  });

  it('指定した長さのパスワードを生成する', () => {
    expect(generateRandomPassword(8)).toHaveLength(8);
    expect(generateRandomPassword(32)).toHaveLength(32);
  });

  it('英数字のみを含む', () => {
    const password = generateRandomPassword(100);
    expect(password).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('毎回異なるパスワードを生成する', () => {
    const password1 = generateRandomPassword();
    const password2 = generateRandomPassword();
    expect(password1).not.toBe(password2);
  });
});

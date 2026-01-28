import { describe, expect, it } from 'vitest';
import {
  getServerBackupPath,
  getServerComposePath,
  getServerDataPath,
  parseMemoryToGB,
} from './config';
import { DEFAULT_SERVER_ID } from './constants';

describe('parseMemoryToGB', () => {
  it('GB単位を正しくパースする', () => {
    expect(parseMemoryToGB('4G')).toBe(4);
    expect(parseMemoryToGB('8G')).toBe(8);
  });

  it('小文字のgも認識する', () => {
    expect(parseMemoryToGB('4g')).toBe(4);
  });

  it('MB単位をGB単位に変換する（切り上げ）', () => {
    expect(parseMemoryToGB('1024M')).toBe(1);
    expect(parseMemoryToGB('2048M')).toBe(2);
    expect(parseMemoryToGB('1500M')).toBe(2); // 切り上げ
  });

  it('単位なしの数値をそのまま返す', () => {
    expect(parseMemoryToGB('4')).toBe(4);
  });
});

describe('getServerComposePath', () => {
  it('デフォルトサーバーはルートのdocker-compose.ymlを返す', () => {
    const result = getServerComposePath(DEFAULT_SERVER_ID);
    expect(result).toContain('docker-compose.yml');
    expect(result).not.toContain('servers');
  });

  it('通常サーバーはserversディレクトリ配下を返す', () => {
    const result = getServerComposePath('test-server-id');
    expect(result).toContain('servers');
    expect(result).toContain('test-server-id');
    expect(result).toContain('docker-compose.yml');
  });
});

describe('getServerDataPath', () => {
  it('デフォルトサーバーはserver/dataを返す', () => {
    const result = getServerDataPath(DEFAULT_SERVER_ID);
    expect(result).toContain('server');
    expect(result).toContain('data');
    expect(result).not.toContain('servers');
  });

  it('通常サーバーはservers/<id>/dataを返す', () => {
    const result = getServerDataPath('test-server-id');
    expect(result).toContain('servers');
    expect(result).toContain('test-server-id');
    expect(result).toContain('data');
  });
});

describe('getServerBackupPath', () => {
  it('デフォルトサーバーはserver/backupsを返す', () => {
    const result = getServerBackupPath(DEFAULT_SERVER_ID);
    expect(result).toContain('server');
    expect(result).toContain('backups');
    expect(result).not.toContain('servers');
  });

  it('通常サーバーはservers/<id>/backupsを返す', () => {
    const result = getServerBackupPath('test-server-id');
    expect(result).toContain('servers');
    expect(result).toContain('test-server-id');
    expect(result).toContain('backups');
  });
});

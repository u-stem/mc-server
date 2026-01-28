import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  getWorldInfo,
  getWorldPath,
  importWorld,
  isValidWorldArchive,
  validateWorldArchive,
} from './world';

const execFileAsync = promisify(execFile);

// テスト用の一時ディレクトリ
let testDir: string;
let testDataPath: string;

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'world-test-'));
  testDataPath = path.join(testDir, 'data');
  await fs.mkdir(testDataPath, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

// テスト用ワールドを作成
async function createTestWorld(worldPath: string): Promise<void> {
  await fs.mkdir(worldPath, { recursive: true });
  // level.dat を作成（実際の Minecraft ワールドには必ず存在する）
  await fs.writeFile(path.join(worldPath, 'level.dat'), 'fake level data');
  // region フォルダを作成
  await fs.mkdir(path.join(worldPath, 'region'), { recursive: true });
}

// テスト用 ZIP を作成
async function createTestZip(
  zipPath: string,
  worldName: string,
  includeLevelDat: boolean = true
): Promise<void> {
  const tempWorldDir = path.join(path.dirname(zipPath), 'temp-world');
  await fs.mkdir(path.join(tempWorldDir, worldName), { recursive: true });

  if (includeLevelDat) {
    await fs.writeFile(path.join(tempWorldDir, worldName, 'level.dat'), 'fake level data');
  }
  await fs.mkdir(path.join(tempWorldDir, worldName, 'region'), { recursive: true });

  await execFileAsync('zip', ['-r', zipPath, worldName], { cwd: tempWorldDir });
  await fs.rm(tempWorldDir, { recursive: true, force: true });
}

// テスト用 tar.gz を作成
async function createTestTarGz(
  tarPath: string,
  worldName: string,
  includeLevelDat: boolean = true
): Promise<void> {
  const tempWorldDir = path.join(path.dirname(tarPath), 'temp-world');
  await fs.mkdir(path.join(tempWorldDir, worldName), { recursive: true });

  if (includeLevelDat) {
    await fs.writeFile(path.join(tempWorldDir, worldName, 'level.dat'), 'fake level data');
  }
  await fs.mkdir(path.join(tempWorldDir, worldName, 'region'), { recursive: true });

  await execFileAsync('tar', ['-czf', tarPath, worldName], { cwd: tempWorldDir });
  await fs.rm(tempWorldDir, { recursive: true, force: true });
}

describe('getWorldPath', () => {
  test('サーバーIDからワールドパスを取得', () => {
    const worldPath = getWorldPath('test-server');
    expect(worldPath).toContain('test-server');
    expect(worldPath).toContain('world');
  });
});

describe('isValidWorldArchive', () => {
  test('.zip ファイルは有効', () => {
    expect(isValidWorldArchive('world.zip')).toBe(true);
  });

  test('.tar.gz ファイルは有効', () => {
    expect(isValidWorldArchive('world.tar.gz')).toBe(true);
  });

  test('.jar ファイルは無効', () => {
    expect(isValidWorldArchive('world.jar')).toBe(false);
  });

  test('拡張子なしは無効', () => {
    expect(isValidWorldArchive('world')).toBe(false);
  });

  test('パストラバーサルを含むファイル名は無効', () => {
    expect(isValidWorldArchive('../world.zip')).toBe(false);
    expect(isValidWorldArchive('foo/../world.zip')).toBe(false);
  });
});

describe('getWorldInfo', () => {
  test('ワールドが存在する場合は情報を返す', async () => {
    const worldPath = path.join(testDataPath, 'world');
    await createTestWorld(worldPath);

    const info = await getWorldInfo(testDataPath);
    expect(info).not.toBeNull();
    expect(info?.exists).toBe(true);
    expect(info?.size).toBeGreaterThan(0);
  });

  test('ワールドが存在しない場合は null を返す', async () => {
    const info = await getWorldInfo(testDataPath);
    expect(info).toBeNull();
  });
});

describe('validateWorldArchive', () => {
  test('有効な ZIP は検証を通過', async () => {
    const zipPath = path.join(testDir, 'valid.zip');
    await createTestZip(zipPath, 'world');

    const buffer = await fs.readFile(zipPath);
    const result = await validateWorldArchive(buffer, 'valid.zip');

    expect(result.valid).toBe(true);
    expect(result.worldFolder).toBe('world');
  });

  test('有効な tar.gz は検証を通過', async () => {
    const tarPath = path.join(testDir, 'valid.tar.gz');
    await createTestTarGz(tarPath, 'world');

    const buffer = await fs.readFile(tarPath);
    const result = await validateWorldArchive(buffer, 'valid.tar.gz');

    expect(result.valid).toBe(true);
    expect(result.worldFolder).toBe('world');
  });

  test('level.dat がないアーカイブは拒否', async () => {
    const zipPath = path.join(testDir, 'invalid.zip');
    await createTestZip(zipPath, 'world', false);

    const buffer = await fs.readFile(zipPath);
    const result = await validateWorldArchive(buffer, 'invalid.zip');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('level.dat');
  });
});

describe('importWorld', () => {
  test('既存ワールドなしで ZIP をインポート', async () => {
    const zipPath = path.join(testDir, 'import.zip');
    await createTestZip(zipPath, 'myworld');

    const buffer = await fs.readFile(zipPath);
    const result = await importWorld(testDataPath, buffer, 'import.zip', false);

    expect(result.success).toBe(true);
    expect(result.message).toContain('インポート');

    // ワールドが存在することを確認
    const worldPath = path.join(testDataPath, 'world');
    const levelDat = path.join(worldPath, 'level.dat');
    await expect(fs.access(levelDat)).resolves.toBeUndefined();
  });

  test('既存ワールドありで overwrite=false は拒否', async () => {
    // 既存ワールドを作成
    const worldPath = path.join(testDataPath, 'world');
    await createTestWorld(worldPath);

    const zipPath = path.join(testDir, 'import.zip');
    await createTestZip(zipPath, 'newworld');

    const buffer = await fs.readFile(zipPath);
    const result = await importWorld(testDataPath, buffer, 'import.zip', false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('既存');
  });

  test('既存ワールドありで overwrite=true はバックアップして上書き', async () => {
    // 既存ワールドを作成
    const worldPath = path.join(testDataPath, 'world');
    await createTestWorld(worldPath);

    const zipPath = path.join(testDir, 'import.zip');
    await createTestZip(zipPath, 'newworld');

    const buffer = await fs.readFile(zipPath);
    const result = await importWorld(testDataPath, buffer, 'import.zip', true);

    expect(result.success).toBe(true);

    // バックアップが存在することを確認
    const files = await fs.readdir(testDataPath);
    const backup = files.find((f) => f.startsWith('world.bak.'));
    expect(backup).toBeDefined();
  });

  test('無効なアーカイブは拒否', async () => {
    const zipPath = path.join(testDir, 'invalid.zip');
    await createTestZip(zipPath, 'world', false);

    const buffer = await fs.readFile(zipPath);
    const result = await importWorld(testDataPath, buffer, 'invalid.zip', false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('level.dat');
  });
});

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { getServerDataPath } from './config';
import { FOLDER_WORLD, MAX_WORLD_UPLOAD_SIZE } from './constants';
import { validateServerId } from './validation';

const execFileAsync = promisify(execFile);

// Re-export for API routes
export { MAX_WORLD_UPLOAD_SIZE };

// 対応するアーカイブ拡張子
const VALID_EXTENSIONS = ['.zip', '.tar.gz'] as const;

export interface WorldInfo {
  exists: boolean;
  size: number;
  modifiedAt: string;
}

export interface WorldValidationResult {
  valid: boolean;
  worldFolder?: string;
  tempDir?: string; // 検証時に展開したディレクトリ（再利用可能）
  error?: string;
}

export interface WorldImportResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * サーバーのワールドディレクトリパスを取得
 */
export function getWorldPath(serverId: string): string {
  const dataPath = getServerDataPath(serverId);
  return path.join(dataPath, FOLDER_WORLD);
}

/**
 * アーカイブファイル名が有効かチェック
 */
export function isValidWorldArchive(filename: string): boolean {
  // パストラバーサルを含む場合は無効
  if (filename.includes('..')) {
    return false;
  }

  // 対応する拡張子かチェック
  return VALID_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

/**
 * ワールド情報を取得
 */
export async function getWorldInfo(dataPath: string): Promise<WorldInfo | null> {
  const worldPath = path.join(dataPath, FOLDER_WORLD);

  try {
    const stats = await fs.stat(worldPath);
    if (!stats.isDirectory()) {
      return null;
    }

    // ディレクトリサイズを計算
    const size = await calculateDirSize(worldPath);

    return {
      exists: true,
      size,
      modifiedAt: stats.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * ディレクトリサイズを計算
 */
async function calculateDirSize(dirPath: string): Promise<number> {
  let size = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      size += await calculateDirSize(entryPath);
    } else {
      const stats = await fs.stat(entryPath);
      size += stats.size;
    }
  }

  return size;
}

/**
 * アーカイブ内に level.dat が存在するか検証
 * @param keepTempDir trueの場合、一時ディレクトリを削除せず返す（インポート時の再利用用）
 */
export async function validateWorldArchive(
  buffer: Buffer,
  filename: string,
  keepTempDir = false
): Promise<WorldValidationResult> {
  const tempDir = await fs.mkdtemp(path.join('/tmp', 'world-validate-'));

  try {
    const archivePath = path.join(tempDir, filename);
    await fs.writeFile(archivePath, buffer);

    // アーカイブを展開
    const extractDir = path.join(tempDir, 'extracted');
    await fs.mkdir(extractDir, { recursive: true });

    if (filename.endsWith('.zip')) {
      await execFileAsync('unzip', ['-q', archivePath, '-d', extractDir]);
    } else if (filename.endsWith('.tar.gz')) {
      await execFileAsync('tar', ['-xzf', archivePath, '-C', extractDir]);
    } else {
      return { valid: false, error: 'Unsupported archive format' };
    }

    // 展開されたディレクトリを検索
    const entries = await fs.readdir(extractDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    // level.dat を探す
    for (const dir of dirs) {
      const levelDatPath = path.join(extractDir, dir.name, 'level.dat');
      try {
        await fs.access(levelDatPath);
        return { valid: true, worldFolder: dir.name, tempDir: keepTempDir ? tempDir : undefined };
      } catch {
        // このディレクトリには level.dat がない
      }
    }

    // ルートに level.dat があるかチェック
    const rootLevelDat = path.join(extractDir, 'level.dat');
    try {
      await fs.access(rootLevelDat);
      return { valid: true, worldFolder: '', tempDir: keepTempDir ? tempDir : undefined };
    } catch {
      // ルートにもない
    }

    return { valid: false, error: 'level.dat not found in archive' };
  } finally {
    if (!keepTempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

/**
 * ワールドをインポート
 */
export async function importWorld(
  dataPath: string,
  buffer: Buffer,
  filename: string,
  overwrite: boolean
): Promise<WorldImportResult> {
  // アーカイブを検証（展開結果を再利用するためkeepTempDir=true）
  const validation = await validateWorldArchive(buffer, filename, true);
  if (!validation.valid || !validation.tempDir) {
    return { success: false, error: validation.error };
  }

  const tempDir = validation.tempDir;

  try {
    const worldPath = path.join(dataPath, FOLDER_WORLD);

    // 既存ワールドをチェック
    try {
      await fs.access(worldPath);
      // 既存ワールドが存在する
      if (!overwrite) {
        return {
          success: false,
          error: '既存のワールドがあります。上書きする場合は overwrite=true を指定してください',
        };
      }

      // バックアップを作成
      const timestamp = Date.now();
      const backupPath = path.join(dataPath, `world.bak.${timestamp}`);
      await fs.rename(worldPath, backupPath);
    } catch {
      // 既存ワールドがない場合は続行
    }

    // 検証時に展開済みのディレクトリを使用
    const extractDir = path.join(tempDir, 'extracted');

    // ワールドフォルダを world にリネームしてコピー
    const worldFolder = validation.worldFolder || '';
    if (worldFolder === '') {
      // ルートに直接ファイルがある場合
      await fs.rename(extractDir, worldPath);
    } else {
      const sourcePath = path.join(extractDir, worldFolder);
      await fs.rename(sourcePath, worldPath);
    }

    return { success: true, message: 'ワールドをインポートしました' };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * サーバーのワールド情報を取得（API用）
 */
export async function getServerWorldInfo(serverId: string): Promise<WorldInfo | null> {
  validateServerId(serverId);
  const dataPath = getServerDataPath(serverId);
  return getWorldInfo(dataPath);
}

/**
 * サーバーにワールドをインポート（API用）
 */
export async function importServerWorld(
  serverId: string,
  buffer: Buffer,
  filename: string,
  overwrite: boolean
): Promise<WorldImportResult> {
  validateServerId(serverId);

  // ファイルサイズチェック
  if (buffer.length > MAX_WORLD_UPLOAD_SIZE) {
    return { success: false, error: 'ファイルサイズが上限（500MB）を超えています' };
  }

  // ファイル名チェック
  if (!isValidWorldArchive(filename)) {
    return {
      success: false,
      error: '対応していないファイル形式です。.zip または .tar.gz を使用してください',
    };
  }

  const dataPath = getServerDataPath(serverId);
  return importWorld(dataPath, buffer, filename, overwrite);
}

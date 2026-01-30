import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type { BackupInfo } from '@/types';
import { getServerBackupPath, getServerDataPath } from './config';
import { FOLDER_MODS, FOLDER_WORLD, TIMEOUT_BACKUP_MS, TIMEOUT_FULL_BACKUP_MS } from './constants';
import {
  ERROR_INVALID_BACKUP_ID_FORMAT,
  ERROR_NO_DATA_TO_BACKUP,
  ERROR_WORLD_FOLDER_NOT_FOUND,
} from './errorMessages';
import { isValidFileName, validateServerId } from './validation';

// 共通ユーティリティを再エクスポート
export { formatSize } from './utils';

const execFileAsync = promisify(execFile);
const BACKUP_EXTENSIONS = ['.tar.gz', '.zip'] as const;

// バックアップ一覧を取得
export async function listBackups(serverId: string): Promise<BackupInfo[]> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const backupPath = getServerBackupPath(serverId);

  try {
    await fs.mkdir(backupPath, { recursive: true });
    const files = await fs.readdir(backupPath);

    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (!file.endsWith('.tar.gz') && !file.endsWith('.zip')) {
        continue;
      }

      const filePath = path.join(backupPath, file);
      const stats = await fs.stat(filePath);

      backups.push({
        id: file.replace(/\.(tar\.gz|zip)$/, ''),
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      });
    }

    // 新しい順にソート
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return backups;
  } catch {
    return [];
  }
}

// バックアップを作成
export async function createBackup(serverId: string): Promise<BackupInfo> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const dataPath = getServerDataPath(serverId);
  const backupPath = getServerBackupPath(serverId);

  await fs.mkdir(backupPath, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.tar.gz`;
  const filePath = path.join(backupPath, filename);

  // world フォルダをバックアップ
  const worldPath = path.join(dataPath, FOLDER_WORLD);

  try {
    await fs.access(worldPath);
  } catch {
    throw new Error(ERROR_WORLD_FOLDER_NOT_FOUND);
  }

  // tar.gz で圧縮（execFile使用でインジェクション防止）
  await execFileAsync('tar', ['-czf', filePath, '-C', dataPath, FOLDER_WORLD], {
    timeout: TIMEOUT_BACKUP_MS,
  });

  const stats = await fs.stat(filePath);

  return {
    id: filename.replace('.tar.gz', ''),
    filename,
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
  };
}

// フルバックアップを作成（world + mods + server.properties + ops.json）
export async function createFullBackup(serverId: string): Promise<BackupInfo> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const dataPath = getServerDataPath(serverId);
  const backupPath = getServerBackupPath(serverId);

  await fs.mkdir(backupPath, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-full-${timestamp}.tar.gz`;
  const filePath = path.join(backupPath, filename);

  // バックアップ対象のファイル・フォルダを確認
  const itemsToBackup: string[] = [];

  // world フォルダ
  const worldPath = path.join(dataPath, FOLDER_WORLD);
  try {
    await fs.access(worldPath);
    itemsToBackup.push(FOLDER_WORLD);
  } catch {
    // world フォルダがなくてもフルバックアップは許可
  }

  // mods フォルダ
  const modsPath = path.join(dataPath, FOLDER_MODS);
  try {
    await fs.access(modsPath);
    itemsToBackup.push(FOLDER_MODS);
  } catch {
    // mods フォルダがなくても続行
  }

  // server.properties
  const propsPath = path.join(dataPath, 'server.properties');
  try {
    await fs.access(propsPath);
    itemsToBackup.push('server.properties');
  } catch {
    // server.properties がなくても続行
  }

  // ops.json
  const opsPath = path.join(dataPath, 'ops.json');
  try {
    await fs.access(opsPath);
    itemsToBackup.push('ops.json');
  } catch {
    // ops.json がなくても続行
  }

  // whitelist.json
  const whitelistPath = path.join(dataPath, 'whitelist.json');
  try {
    await fs.access(whitelistPath);
    itemsToBackup.push('whitelist.json');
  } catch {
    // whitelist.json がなくても続行
  }

  if (itemsToBackup.length === 0) {
    throw new Error(ERROR_NO_DATA_TO_BACKUP);
  }

  // tar.gz で圧縮（execFile使用でインジェクション防止）
  await execFileAsync('tar', ['-czf', filePath, '-C', dataPath, ...itemsToBackup], {
    timeout: TIMEOUT_FULL_BACKUP_MS,
  });

  const stats = await fs.stat(filePath);

  return {
    id: filename.replace('.tar.gz', ''),
    filename,
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
  };
}

// バックアップを削除
export async function deleteBackup(serverId: string, backupId: string): Promise<boolean> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // バックアップIDをバリデーション（パストラバーサル防止）
  if (!isValidFileName(backupId)) {
    throw new Error(ERROR_INVALID_BACKUP_ID_FORMAT);
  }

  const backupPath = getServerBackupPath(serverId);

  // 厳密なファイル名マッチング（startsWith は使わない）
  const files = await fs.readdir(backupPath);
  const backupFile = files.find((f) => BACKUP_EXTENSIONS.some((ext) => f === `${backupId}${ext}`));

  if (!backupFile) {
    return false;
  }

  await fs.unlink(path.join(backupPath, backupFile));
  return true;
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ModInfo } from '@/types';
import { getServerDataPath } from './config';
import { FOLDER_MODS, MAX_UPLOAD_SIZE } from './constants';
import { validateServerId } from './validation';

// Mod ディレクトリパスを取得
export function getModsPath(serverId: string): string {
  const dataPath = getServerDataPath(serverId);
  return path.join(dataPath, FOLDER_MODS);
}

// Mod ファイル名のバリデーション
export function isValidModFilename(filename: string): boolean {
  // .jar または .jar.disabled のみ許可
  // 英数字、ハイフン、アンダースコア、ドットのみ
  const pattern = /^[a-zA-Z0-9_\-.]+\.jar(\.disabled)?$/;
  return pattern.test(filename) && !filename.includes('..');
}

// Mod 一覧を取得
export async function listMods(serverId: string): Promise<ModInfo[]> {
  validateServerId(serverId);
  const modsPath = getModsPath(serverId);

  try {
    await fs.mkdir(modsPath, { recursive: true });
    const files = await fs.readdir(modsPath);
    const mods: ModInfo[] = [];

    for (const file of files) {
      // .jar または .jar.disabled ファイルのみ
      if (!file.endsWith('.jar') && !file.endsWith('.jar.disabled')) {
        continue;
      }

      const filePath = path.join(modsPath, file);
      const stats = await fs.stat(filePath);

      // ディレクトリはスキップ
      if (stats.isDirectory()) {
        continue;
      }

      mods.push({
        filename: file,
        size: stats.size,
        enabled: !file.endsWith('.disabled'),
        modifiedAt: stats.mtime.toISOString(),
      });
    }

    // ファイル名でソート
    mods.sort((a, b) => a.filename.localeCompare(b.filename));

    return mods;
  } catch {
    return [];
  }
}

// Mod をアップロード
export async function uploadMod(
  serverId: string,
  filename: string,
  buffer: Buffer
): Promise<ModInfo> {
  validateServerId(serverId);

  // ファイル名をサニタイズ（英数字、ハイフン、アンダースコア、ドットのみ）
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');

  // .jar 拡張子の確認
  if (!sanitizedFilename.endsWith('.jar')) {
    throw new Error('Only .jar files are allowed');
  }

  // ファイル名の基本バリデーション
  if (!isValidModFilename(sanitizedFilename)) {
    throw new Error('Invalid mod filename');
  }

  // ファイルサイズの確認
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new Error('File size exceeds maximum allowed (50MB)');
  }

  const modsPath = getModsPath(serverId);
  await fs.mkdir(modsPath, { recursive: true });

  const filePath = path.join(modsPath, sanitizedFilename);
  await fs.writeFile(filePath, buffer);

  const stats = await fs.stat(filePath);

  return {
    filename: sanitizedFilename,
    size: stats.size,
    enabled: true,
    modifiedAt: stats.mtime.toISOString(),
  };
}

// Mod を削除
export async function deleteMod(serverId: string, filename: string): Promise<boolean> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidModFilename(filename)) {
    throw new Error('Invalid mod filename');
  }

  const modsPath = getModsPath(serverId);
  const filePath = path.join(modsPath, filename);

  try {
    // ファイルが存在するか確認
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// Mod の有効/無効を切り替え
export async function toggleMod(serverId: string, filename: string): Promise<ModInfo> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidModFilename(filename)) {
    throw new Error('Invalid mod filename');
  }

  const modsPath = getModsPath(serverId);
  const filePath = path.join(modsPath, filename);

  // ファイルが存在するか確認
  try {
    await fs.access(filePath);
  } catch {
    throw new Error('Mod file not found');
  }

  let newFilename: string;
  if (filename.endsWith('.disabled')) {
    // 有効化: .jar.disabled → .jar
    newFilename = filename.replace(/\.disabled$/, '');
  } else {
    // 無効化: .jar → .jar.disabled
    newFilename = `${filename}.disabled`;
  }

  const newFilePath = path.join(modsPath, newFilename);
  await fs.rename(filePath, newFilePath);

  const stats = await fs.stat(newFilePath);

  return {
    filename: newFilename,
    size: stats.size,
    enabled: !newFilename.endsWith('.disabled'),
    modifiedAt: stats.mtime.toISOString(),
  };
}

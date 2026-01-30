/**
 * アドオン（プラグイン/Mod）管理の共通ロジック
 *
 * plugins.ts と mods.ts の重複コードを統合
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AddOnFileInfo, ModInfo, PluginInfo } from '@/types';
import { getServerDataPath } from './config';
import { MAX_UPLOAD_SIZE } from './constants';
import {
  createAddonNotFoundError,
  ERROR_FILE_SIZE_EXCEEDS_LIMIT_50MB,
  ERROR_INVALID_ADDON_FILENAME,
  ERROR_JAR_FILE_ONLY,
} from './errorMessages';
import { validateServerId } from './validation';

// 型を再エクスポート（後方互換性のため）
export type { AddOnFileInfo };

/**
 * アドオンマネージャの設定
 */
export interface AddonManagerConfig {
  folderName: string;
  typeName: string; // エラーメッセージ用 ("plugin" or "mod")
}

/**
 * JAR ファイル名のバリデーション
 * .jar または .jar.disabled のみ許可
 * 英数字、ハイフン、アンダースコア、ドットのみ
 */
export function isValidJarFilename(filename: string): boolean {
  const pattern = /^[a-zA-Z0-9_\-.]+\.jar(\.disabled)?$/;
  return pattern.test(filename) && !filename.includes('..');
}

/**
 * アドオンディレクトリパスを取得
 */
export function getAddonPath(serverId: string, folderName: string): string {
  const dataPath = getServerDataPath(serverId);
  return path.join(dataPath, folderName);
}

/**
 * アドオン一覧を取得
 */
export async function listAddons<T extends AddOnFileInfo>(
  serverId: string,
  config: AddonManagerConfig
): Promise<T[]> {
  validateServerId(serverId);
  const addonPath = getAddonPath(serverId, config.folderName);

  try {
    await fs.mkdir(addonPath, { recursive: true });
    const files = await fs.readdir(addonPath);
    const addons: T[] = [];

    for (const file of files) {
      // .jar または .jar.disabled ファイルのみ
      if (!file.endsWith('.jar') && !file.endsWith('.jar.disabled')) {
        continue;
      }

      const filePath = path.join(addonPath, file);
      const stats = await fs.stat(filePath);

      // ディレクトリはスキップ
      if (stats.isDirectory()) {
        continue;
      }

      addons.push({
        filename: file,
        size: stats.size,
        enabled: !file.endsWith('.disabled'),
        modifiedAt: stats.mtime.toISOString(),
      } as T);
    }

    // ファイル名でソート
    addons.sort((a, b) => a.filename.localeCompare(b.filename));

    return addons;
  } catch {
    return [];
  }
}

/**
 * アドオンをアップロード
 */
export async function uploadAddon<T extends AddOnFileInfo>(
  serverId: string,
  filename: string,
  buffer: Buffer,
  config: AddonManagerConfig
): Promise<T> {
  validateServerId(serverId);

  // ファイル名をサニタイズ（英数字、ハイフン、アンダースコア、ドットのみ）
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');

  // .jar 拡張子の確認
  if (!sanitizedFilename.endsWith('.jar')) {
    throw new Error(ERROR_JAR_FILE_ONLY);
  }

  // ファイル名の基本バリデーション
  if (!isValidJarFilename(sanitizedFilename)) {
    throw new Error(ERROR_INVALID_ADDON_FILENAME);
  }

  // ファイルサイズの確認
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new Error(ERROR_FILE_SIZE_EXCEEDS_LIMIT_50MB);
  }

  const addonPath = getAddonPath(serverId, config.folderName);
  await fs.mkdir(addonPath, { recursive: true });

  const filePath = path.join(addonPath, sanitizedFilename);
  await fs.writeFile(filePath, buffer);

  const stats = await fs.stat(filePath);

  return {
    filename: sanitizedFilename,
    size: stats.size,
    enabled: true,
    modifiedAt: stats.mtime.toISOString(),
  } as T;
}

/**
 * アドオンを削除
 */
export async function deleteAddon(
  serverId: string,
  filename: string,
  config: AddonManagerConfig
): Promise<boolean> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidJarFilename(filename)) {
    throw new Error(ERROR_INVALID_ADDON_FILENAME);
  }

  const addonPath = getAddonPath(serverId, config.folderName);
  const filePath = path.join(addonPath, filename);

  try {
    // ファイルが存在するか確認
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * アドオンの有効/無効を切り替え
 */
export async function toggleAddon<T extends AddOnFileInfo>(
  serverId: string,
  filename: string,
  config: AddonManagerConfig
): Promise<T> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidJarFilename(filename)) {
    throw new Error(ERROR_INVALID_ADDON_FILENAME);
  }

  const addonPath = getAddonPath(serverId, config.folderName);
  const filePath = path.join(addonPath, filename);

  // ファイルが存在するか確認
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(createAddonNotFoundError(config.typeName));
  }

  let newFilename: string;
  if (filename.endsWith('.disabled')) {
    // 有効化: .jar.disabled → .jar
    newFilename = filename.replace(/\.disabled$/, '');
  } else {
    // 無効化: .jar → .jar.disabled
    newFilename = `${filename}.disabled`;
  }

  const newFilePath = path.join(addonPath, newFilename);
  await fs.rename(filePath, newFilePath);

  const stats = await fs.stat(newFilePath);

  return {
    filename: newFilename,
    size: stats.size,
    enabled: !newFilename.endsWith('.disabled'),
    modifiedAt: stats.mtime.toISOString(),
  } as T;
}

// プラグイン用の設定
export const PLUGIN_CONFIG: AddonManagerConfig = {
  folderName: 'plugins',
  typeName: 'プラグイン',
};

// Mod 用の設定
export const MOD_CONFIG: AddonManagerConfig = {
  folderName: 'mods',
  typeName: 'Mod',
};

// 型付きヘルパー関数（後方互換性のため）
export const listPluginsImpl = (serverId: string) =>
  listAddons<PluginInfo>(serverId, PLUGIN_CONFIG);
export const listModsImpl = (serverId: string) => listAddons<ModInfo>(serverId, MOD_CONFIG);

export const uploadPluginImpl = (serverId: string, filename: string, buffer: Buffer) =>
  uploadAddon<PluginInfo>(serverId, filename, buffer, PLUGIN_CONFIG);
export const uploadModImpl = (serverId: string, filename: string, buffer: Buffer) =>
  uploadAddon<ModInfo>(serverId, filename, buffer, MOD_CONFIG);

export const deletePluginImpl = (serverId: string, filename: string) =>
  deleteAddon(serverId, filename, PLUGIN_CONFIG);
export const deleteModImpl = (serverId: string, filename: string) =>
  deleteAddon(serverId, filename, MOD_CONFIG);

export const togglePluginImpl = (serverId: string, filename: string) =>
  toggleAddon<PluginInfo>(serverId, filename, PLUGIN_CONFIG);
export const toggleModImpl = (serverId: string, filename: string) =>
  toggleAddon<ModInfo>(serverId, filename, MOD_CONFIG);

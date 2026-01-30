/**
 * Mod 管理
 *
 * アドオンマネージャを使用した薄いラッパー層
 */
import type { ModInfo } from '@/types';
import {
  deleteModImpl,
  getAddonPath,
  isValidJarFilename,
  listModsImpl,
  MOD_CONFIG,
  toggleModImpl,
  uploadModImpl,
} from './addonManager';

// Mod ディレクトリパスを取得
export function getModsPath(serverId: string): string {
  return getAddonPath(serverId, MOD_CONFIG.folderName);
}

// Mod ファイル名のバリデーション
export const isValidModFilename = isValidJarFilename;

// Mod 一覧を取得
export function listMods(serverId: string): Promise<ModInfo[]> {
  return listModsImpl(serverId);
}

// Mod をアップロード
export function uploadMod(serverId: string, filename: string, buffer: Buffer): Promise<ModInfo> {
  return uploadModImpl(serverId, filename, buffer);
}

// Mod を削除
export function deleteMod(serverId: string, filename: string): Promise<boolean> {
  return deleteModImpl(serverId, filename);
}

// Mod の有効/無効を切り替え
export function toggleMod(serverId: string, filename: string): Promise<ModInfo> {
  return toggleModImpl(serverId, filename);
}

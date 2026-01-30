/**
 * プラグイン管理
 *
 * アドオンマネージャを使用した薄いラッパー層
 */
import type { PluginInfo } from '@/types';
import {
  deletePluginImpl,
  getAddonPath,
  isValidJarFilename,
  listPluginsImpl,
  PLUGIN_CONFIG,
  togglePluginImpl,
  uploadPluginImpl,
} from './addonManager';

// プラグインディレクトリパスを取得
export function getPluginsPath(serverId: string): string {
  return getAddonPath(serverId, PLUGIN_CONFIG.folderName);
}

// プラグインファイル名のバリデーション
export const isValidPluginFilename = isValidJarFilename;

// プラグイン一覧を取得
export function listPlugins(serverId: string): Promise<PluginInfo[]> {
  return listPluginsImpl(serverId);
}

// プラグインをアップロード
export function uploadPlugin(
  serverId: string,
  filename: string,
  buffer: Buffer
): Promise<PluginInfo> {
  return uploadPluginImpl(serverId, filename, buffer);
}

// プラグインを削除
export function deletePlugin(serverId: string, filename: string): Promise<boolean> {
  return deletePluginImpl(serverId, filename);
}

// プラグインの有効/無効を切り替え
export function togglePlugin(serverId: string, filename: string): Promise<PluginInfo> {
  return togglePluginImpl(serverId, filename);
}

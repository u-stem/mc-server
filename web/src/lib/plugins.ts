import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PluginInfo } from '@/types';
import { getServerDataPath } from './config';
import { FOLDER_PLUGINS, MAX_UPLOAD_SIZE } from './constants';
import { validateServerId } from './validation';

// プラグインディレクトリパスを取得
export function getPluginsPath(serverId: string): string {
  const dataPath = getServerDataPath(serverId);
  return path.join(dataPath, FOLDER_PLUGINS);
}

// プラグインファイル名のバリデーション
export function isValidPluginFilename(filename: string): boolean {
  // .jar または .jar.disabled のみ許可
  // 英数字、ハイフン、アンダースコア、ドットのみ
  const pattern = /^[a-zA-Z0-9_\-.]+\.jar(\.disabled)?$/;
  return pattern.test(filename) && !filename.includes('..');
}

// プラグイン一覧を取得
export async function listPlugins(serverId: string): Promise<PluginInfo[]> {
  validateServerId(serverId);
  const pluginsPath = getPluginsPath(serverId);

  try {
    await fs.mkdir(pluginsPath, { recursive: true });
    const files = await fs.readdir(pluginsPath);
    const plugins: PluginInfo[] = [];

    for (const file of files) {
      // .jar または .jar.disabled ファイルのみ
      if (!file.endsWith('.jar') && !file.endsWith('.jar.disabled')) {
        continue;
      }

      const filePath = path.join(pluginsPath, file);
      const stats = await fs.stat(filePath);

      // ディレクトリはスキップ
      if (stats.isDirectory()) {
        continue;
      }

      plugins.push({
        filename: file,
        size: stats.size,
        enabled: !file.endsWith('.disabled'),
        modifiedAt: stats.mtime.toISOString(),
      });
    }

    // ファイル名でソート
    plugins.sort((a, b) => a.filename.localeCompare(b.filename));

    return plugins;
  } catch {
    return [];
  }
}

// プラグインをアップロード
export async function uploadPlugin(
  serverId: string,
  filename: string,
  buffer: Buffer
): Promise<PluginInfo> {
  validateServerId(serverId);

  // ファイル名をサニタイズ（英数字、ハイフン、アンダースコア、ドットのみ）
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');

  // .jar 拡張子の確認
  if (!sanitizedFilename.endsWith('.jar')) {
    throw new Error('Only .jar files are allowed');
  }

  // ファイル名の基本バリデーション
  if (!isValidPluginFilename(sanitizedFilename)) {
    throw new Error('Invalid plugin filename');
  }

  // ファイルサイズの確認
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new Error('File size exceeds maximum allowed (50MB)');
  }

  const pluginsPath = getPluginsPath(serverId);
  await fs.mkdir(pluginsPath, { recursive: true });

  const filePath = path.join(pluginsPath, sanitizedFilename);
  await fs.writeFile(filePath, buffer);

  const stats = await fs.stat(filePath);

  return {
    filename: sanitizedFilename,
    size: stats.size,
    enabled: true,
    modifiedAt: stats.mtime.toISOString(),
  };
}

// プラグインを削除
export async function deletePlugin(serverId: string, filename: string): Promise<boolean> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidPluginFilename(filename)) {
    throw new Error('Invalid plugin filename');
  }

  const pluginsPath = getPluginsPath(serverId);
  const filePath = path.join(pluginsPath, filename);

  try {
    // ファイルが存在するか確認
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// プラグインの有効/無効を切り替え
export async function togglePlugin(serverId: string, filename: string): Promise<PluginInfo> {
  validateServerId(serverId);

  // ファイル名のバリデーション
  if (!isValidPluginFilename(filename)) {
    throw new Error('Invalid plugin filename');
  }

  const pluginsPath = getPluginsPath(serverId);
  const filePath = path.join(pluginsPath, filename);

  // ファイルが存在するか確認
  try {
    await fs.access(filePath);
  } catch {
    throw new Error('Plugin file not found');
  }

  let newFilename: string;
  if (filename.endsWith('.disabled')) {
    // 有効化: .jar.disabled → .jar
    newFilename = filename.replace(/\.disabled$/, '');
  } else {
    // 無効化: .jar → .jar.disabled
    newFilename = `${filename}.disabled`;
  }

  const newFilePath = path.join(pluginsPath, newFilename);
  await fs.rename(filePath, newFilePath);

  const stats = await fs.stat(newFilePath);

  return {
    filename: newFilename,
    size: stats.size,
    enabled: !newFilename.endsWith('.disabled'),
    modifiedAt: stats.mtime.toISOString(),
  };
}

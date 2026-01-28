// おすすめプラグインのカタログ
// Modrinth APIを使用してダウンロード

import { MODRINTH_API_URL } from './constants';
import { logger } from './logger';

export interface RecommendedPlugin {
  id: string;
  name: string;
  description: string;
  modrinthId: string; // Modrinthのプロジェクトslug
  category: 'performance' | 'utility' | 'management';
}

export const RECOMMENDED_PLUGINS: RecommendedPlugin[] = [
  {
    id: 'spark',
    name: 'Spark',
    description: 'パフォーマンス監視・プロファイラ。サーバーの負荷原因を特定できます。',
    modrinthId: 'spark',
    category: 'performance',
  },
  {
    id: 'luckperms',
    name: 'LuckPerms',
    description: '権限管理プラグイン。プレイヤーの権限を細かく設定できます。',
    modrinthId: 'luckperms',
    category: 'management',
  },
  {
    id: 'chunky',
    name: 'Chunky',
    description: 'ワールド事前生成ツール。探索時のラグを軽減できます。',
    modrinthId: 'chunky',
    category: 'performance',
  },
];

// Modrinth APIからプラグイン情報を取得
export interface ModrinthVersion {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: {
    url: string;
    filename: string;
    size: number;
  }[];
}

export interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  downloads: number;
  icon_url: string | null;
}

// プロジェクト情報を取得
export async function getModrinthProject(slug: string): Promise<ModrinthProject | null> {
  try {
    const res = await fetch(`${MODRINTH_API_URL}/project/${slug}`, {
      headers: {
        'User-Agent': 'mc-server-manager/1.0',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// 指定バージョンに対応したプラグインのダウンロードURLを取得
export async function getPluginDownloadUrl(
  modrinthId: string,
  mcVersion: string
): Promise<{ url: string; filename: string; size: number } | null> {
  try {
    // まず全バージョンを取得（ローダーフィルタなし）
    const url = `${MODRINTH_API_URL}/project/${modrinthId}/version`;
    logger.debug('Fetching all Modrinth versions:', url);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'mc-server-manager/1.0 (contact@example.com)',
      },
    });

    if (!res.ok) {
      logger.error('Modrinth API error:', res.status, await res.text());
      return null;
    }

    const allVersions: ModrinthVersion[] = await res.json();
    logger.debug('Total versions found:', allVersions.length);

    if (allVersions.length === 0) {
      logger.error('No versions found for plugin:', modrinthId);
      return null;
    }

    // Bukkitプラグイン用のローダー
    const pluginLoaders = ['bukkit', 'spigot', 'paper', 'purpur', 'folia'];

    // プラグイン用のバージョンをフィルタ
    const pluginVersions = allVersions.filter((v) =>
      v.loaders.some((loader) => pluginLoaders.includes(loader.toLowerCase()))
    );

    logger.debug('Plugin versions found:', pluginVersions.length);
    if (pluginVersions.length > 0) {
      logger.debug('Available loaders:', [...new Set(pluginVersions.flatMap((v) => v.loaders))]);
    }

    // MCバージョンに対応するものを探す
    let targetVersion = pluginVersions.find((v) => v.game_versions.includes(mcVersion));

    // 見つからない場合は最新のプラグインバージョンを使用
    if (!targetVersion && pluginVersions.length > 0) {
      logger.debug('No exact MC version match, using latest plugin version');
      targetVersion = pluginVersions[0];
    }

    // それでも見つからない場合は全バージョンから最新を使用
    if (!targetVersion) {
      logger.debug('No plugin version found, using latest overall version');
      targetVersion = allVersions[0];
    }

    const file = targetVersion.files.find((f) => f.filename.endsWith('.jar'));
    if (!file) {
      logger.error('No jar file found in version');
      return null;
    }

    logger.debug(
      'Selected version:',
      targetVersion.version_number,
      'loaders:',
      targetVersion.loaders,
      'file:',
      file.filename
    );
    return { url: file.url, filename: file.filename, size: file.size };
  } catch (error) {
    logger.error('Error fetching plugin download URL:', error);
    return null;
  }
}

// プラグインをダウンロード
export async function downloadPluginFromModrinth(
  modrinthId: string,
  mcVersion: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  logger.info('Downloading plugin:', modrinthId, 'for MC version:', mcVersion);

  const downloadInfo = await getPluginDownloadUrl(modrinthId, mcVersion);
  if (!downloadInfo) {
    logger.error('Could not get download URL for:', modrinthId);
    return null;
  }

  try {
    logger.debug('Downloading from:', downloadInfo.url);
    const res = await fetch(downloadInfo.url, {
      headers: {
        'User-Agent': 'mc-server-manager/1.0 (contact@example.com)',
      },
    });

    if (!res.ok) {
      logger.error('Download failed:', res.status, res.statusText);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    logger.info('Downloaded:', downloadInfo.filename, 'size:', arrayBuffer.byteLength);

    return {
      buffer: Buffer.from(arrayBuffer),
      filename: downloadInfo.filename,
    };
  } catch (error) {
    logger.error('Error downloading plugin:', error);
    return null;
  }
}

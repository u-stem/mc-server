/**
 * プラグイン自動更新機能
 */
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { PluginAutoUpdateConfig, PluginUpdateInfo, PluginUpdateState } from '@/types';
import { getAutomationConfig, getPluginUpdateState, savePluginUpdateState } from './automation';
import { getServer } from './config';
import {
  MODRINTH_API_URL,
  MS_PER_HOUR,
  PLUGIN_SERVER_LOADERS,
  TIMEOUT_MODRINTH_MS,
  TIMEOUT_PLUGIN_VERSION_MS,
} from './constants';
import { notifyPluginUpdates } from './discord';
import { logger } from './logger';
import { getPluginsPath, listPlugins } from './plugins';

const execFileAsync = promisify(execFile);

/**
 * JARファイルからplugin.ymlを読み取ってバージョンを取得
 */
export async function getPluginVersionFromJar(jarPath: string): Promise<{
  name: string | null;
  version: string | null;
}> {
  try {
    // unzip -p でplugin.ymlの内容を取得
    const { stdout } = await execFileAsync('unzip', ['-p', jarPath, 'plugin.yml'], {
      timeout: TIMEOUT_PLUGIN_VERSION_MS,
    });

    // plugin.ymlをパース（簡易的なYAMLパース）
    const nameMatch = stdout.match(/^name:\s*['"]?(.+?)['"]?\s*$/m);
    const versionMatch = stdout.match(/^version:\s*['"]?(.+?)['"]?\s*$/m);

    return {
      name: nameMatch ? nameMatch[1].trim() : null,
      version: versionMatch ? versionMatch[1].trim() : null,
    };
  } catch {
    // Fabric/Forgeの場合はfabric.mod.jsonを試す
    try {
      const { stdout } = await execFileAsync('unzip', ['-p', jarPath, 'fabric.mod.json'], {
        timeout: TIMEOUT_PLUGIN_VERSION_MS,
      });

      const json = JSON.parse(stdout);
      return {
        name: json.name || json.id || null,
        version: json.version || null,
      };
    } catch {
      return { name: null, version: null };
    }
  }
}

/**
 * ファイル名からプラグイン名を推測
 */
export function extractPluginNameFromFilename(filename: string): string {
  // .jar または .jar.disabled を除去
  let name = filename.replace(/\.jar(\.disabled)?$/, '');

  // バージョン部分を除去（例: spark-1.10.73-paper → spark）
  // 一般的なパターン: name-version、name_version、nameversion
  name = name
    .replace(/-[\d.]+(-[a-zA-Z0-9]+)?$/, '') // -1.0.0-paper
    .replace(/_[\d.]+(-[a-zA-Z0-9]+)?$/, '') // _1.0.0-paper
    .replace(/[\d.]+$/, ''); // trailing numbers

  return name.toLowerCase();
}

/**
 * Modrinthでプロジェクトを検索
 */
export async function searchModrinth(
  query: string,
  facets?: string[][]
): Promise<Array<{ slug: string; title: string; project_id: string }>> {
  try {
    const facetsParam = facets ? `&facets=${encodeURIComponent(JSON.stringify(facets))}` : '';
    const response = await fetch(
      `${MODRINTH_API_URL}/search?query=${encodeURIComponent(query)}&limit=5${facetsParam}`,
      {
        headers: {
          'User-Agent': 'mc-server-manager/1.0',
        },
        signal: AbortSignal.timeout(TIMEOUT_MODRINTH_MS),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits || [];
  } catch {
    return [];
  }
}

/**
 * Modrinthプロジェクトの最新バージョンを取得
 */
export async function getModrinthLatestVersion(
  projectId: string,
  gameVersion?: string,
  loaders?: string[]
): Promise<string | null> {
  try {
    let url = `${MODRINTH_API_URL}/project/${projectId}/version?limit=1`;
    if (gameVersion) {
      url += `&game_versions=["${gameVersion}"]`;
    }
    if (loaders && loaders.length > 0) {
      url += `&loaders=${JSON.stringify(loaders)}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mc-server-manager/1.0',
      },
      signal: AbortSignal.timeout(TIMEOUT_MODRINTH_MS),
    });

    if (!response.ok) {
      return null;
    }

    const versions = await response.json();
    if (versions.length > 0) {
      return versions[0].version_number;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * プラグインとModrinthプロジェクトをマッチング
 */
export async function matchPluginToModrinth(
  pluginName: string
): Promise<{ projectId: string; slug: string } | null> {
  // まずプラグイン名で検索
  const results = await searchModrinth(pluginName, [['project_type:plugin'], ['project_type:mod']]);

  if (results.length === 0) {
    return null;
  }

  // 名前が近いものを選択
  const normalizedName = pluginName.toLowerCase();
  for (const result of results) {
    const slug = result.slug.toLowerCase();
    const title = result.title.toLowerCase();

    if (slug === normalizedName || title === normalizedName) {
      return { projectId: result.project_id, slug: result.slug };
    }
  }

  // 完全一致がなければ最初の結果を返す
  return { projectId: results[0].project_id, slug: results[0].slug };
}

/**
 * プラグインの更新をチェック
 */
export async function checkPluginUpdates(serverId: string): Promise<PluginUpdateInfo[]> {
  const config = await getAutomationConfig(serverId);
  const server = await getServer(serverId);

  if (!server || !config.pluginUpdate.enabled) {
    return [];
  }

  logger.info(`[PluginUpdater] Checking updates for ${server.name} (${serverId})`);

  const plugins = await listPlugins(serverId);
  const pluginsPath = getPluginsPath(serverId);
  const updates: PluginUpdateInfo[] = [];
  const now = new Date().toISOString();

  for (const plugin of plugins) {
    // 除外リストにあるプラグインはスキップ
    const baseName = extractPluginNameFromFilename(plugin.filename);
    if (config.pluginUpdate.excludePlugins.some((ex) => ex.toLowerCase() === baseName)) {
      continue;
    }

    // JARからバージョン情報を取得
    const jarPath = path.join(pluginsPath, plugin.filename);
    const { name: pluginNameFromJar, version: currentVersion } =
      await getPluginVersionFromJar(jarPath);

    const pluginName = pluginNameFromJar || baseName;

    if (!currentVersion) {
      logger.debug(`[PluginUpdater] Could not determine version for ${plugin.filename}`);
      continue;
    }

    // Modrinthでプロジェクトを検索
    const modrinthMatch = await matchPluginToModrinth(pluginName);

    if (!modrinthMatch) {
      logger.debug(`[PluginUpdater] No Modrinth match for ${pluginName}`);
      updates.push({
        pluginName,
        currentVersion,
        latestVersion: currentVersion,
        modrinthProjectId: null,
        updateAvailable: false,
        lastChecked: now,
      });
      continue;
    }

    // 最新バージョンを取得
    const loaders = [...PLUGIN_SERVER_LOADERS];
    const latestVersion = await getModrinthLatestVersion(
      modrinthMatch.projectId,
      server.version,
      loaders
    );

    if (!latestVersion) {
      logger.debug(`[PluginUpdater] No compatible version found for ${pluginName}`);
      updates.push({
        pluginName,
        currentVersion,
        latestVersion: currentVersion,
        modrinthProjectId: modrinthMatch.projectId,
        updateAvailable: false,
        lastChecked: now,
      });
      continue;
    }

    // バージョン比較（簡易的な比較）
    const updateAvailable = normalizeVersion(latestVersion) !== normalizeVersion(currentVersion);

    updates.push({
      pluginName,
      currentVersion,
      latestVersion,
      modrinthProjectId: modrinthMatch.projectId,
      updateAvailable,
      lastChecked: now,
    });

    if (updateAvailable) {
      logger.info(
        `[PluginUpdater] Update available for ${pluginName}: ${currentVersion} → ${latestVersion}`
      );
    }
  }

  // 状態を保存
  const state: PluginUpdateState = {
    lastCheckTime: now,
    updates,
  };
  await savePluginUpdateState(serverId, state);

  // 更新があればDiscord通知
  const availableUpdates = updates.filter((u) => u.updateAvailable);
  if (availableUpdates.length > 0 && config.pluginUpdate.notifyOnUpdate) {
    await notifyPluginUpdates(
      serverId,
      server.name,
      availableUpdates.map((u) => ({
        name: u.pluginName,
        currentVersion: u.currentVersion,
        latestVersion: u.latestVersion,
      }))
    );
  }

  logger.info(
    `[PluginUpdater] Check complete for ${server.name}: ${availableUpdates.length} updates available`
  );

  return updates;
}

/**
 * バージョン文字列を正規化（比較用）
 */
function normalizeVersion(version: string): string {
  // 先頭の v を除去、小文字化
  return version.replace(/^v/i, '').toLowerCase();
}

/**
 * スケジュールチェックを実行すべきか判定
 */
export function shouldRunPluginCheck(
  config: PluginAutoUpdateConfig,
  state: PluginUpdateState,
  now: Date
): boolean {
  if (!config.enabled) {
    return false;
  }

  if (!state.lastCheckTime) {
    return true;
  }

  const lastCheck = new Date(state.lastCheckTime);
  const intervalMs = config.checkIntervalHours * MS_PER_HOUR;
  const timeSinceLastCheck = now.getTime() - lastCheck.getTime();

  return timeSinceLastCheck >= intervalMs;
}

/**
 * プラグイン更新状態を取得（API用）
 */
export async function getPluginUpdatesStatus(serverId: string): Promise<{
  enabled: boolean;
  state: PluginUpdateState;
  config: PluginAutoUpdateConfig;
}> {
  const config = await getAutomationConfig(serverId);
  const state = await getPluginUpdateState(serverId);

  return {
    enabled: config.pluginUpdate.enabled,
    state,
    config: config.pluginUpdate,
  };
}

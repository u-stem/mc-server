/**
 * オートメーション統合スケジューラー
 *
 * 1分ごとに実行され、各サーバーのオートメーションタスクを処理する
 */

import { runScheduledBackup, shouldRunScheduledBackup } from './autoBackup';
import { getAutomationConfig, getBackupState, getPluginUpdateState } from './automation';
import { getAllServers } from './config';
import { MS_PER_MINUTE, MS_PER_SECOND } from './constants';
import { checkServerHealth } from './healthMonitor';
import { logger } from './logger';
import { checkPluginUpdates, shouldRunPluginCheck } from './pluginUpdater';

// 最後のヘルスチェック時刻（サーバーIDごと）
const lastHealthCheckTime = new Map<string, number>();

// 意図的な停止操作をトラッキング（クラッシュ検出の誤検知防止）
const recentStopRequests = new Set<string>();

// 停止マークの有効期間（60秒）
const STOP_MARK_EXPIRY_MS = MS_PER_MINUTE;

/**
 * サーバーの意図的な停止をマーク
 */
export function markServerStopping(serverId: string): void {
  recentStopRequests.add(serverId);
  setTimeout(() => recentStopRequests.delete(serverId), STOP_MARK_EXPIRY_MS);
}

/**
 * 意図的な停止かどうかを確認
 */
export function isIntentionalStop(serverId: string): boolean {
  return recentStopRequests.has(serverId);
}

/**
 * サーバー削除時のクリーンアップ（メモリリーク防止）
 */
export function cleanupServerState(serverId: string): void {
  lastHealthCheckTime.delete(serverId);
  recentStopRequests.delete(serverId);
}

/**
 * オートメーションタスクのメインループ（1分ごとに実行）
 */
export async function runAutomationTick(): Promise<void> {
  try {
    const servers = await getAllServers();
    const now = new Date();

    for (const server of servers) {
      try {
        await processServerAutomation(server.id, now);
      } catch (error) {
        logger.error(`[AutomationScheduler] Error processing server ${server.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('[AutomationScheduler] Error in automation tick:', error);
  }
}

/**
 * 個別サーバーのオートメーションを処理
 */
async function processServerAutomation(serverId: string, now: Date): Promise<void> {
  const config = await getAutomationConfig(serverId);

  // 自動バックアップ
  if (config.backup.enabled) {
    const backupState = await getBackupState(serverId);
    if (shouldRunScheduledBackup(config.backup, backupState, now)) {
      logger.info(`[AutomationScheduler] Running scheduled backup for ${serverId}`);
      await runScheduledBackup(serverId);
    }
  }

  // ヘルスチェック
  if (config.healthCheck.enabled) {
    const lastCheck = lastHealthCheckTime.get(serverId) || 0;
    const intervalMs = config.healthCheck.checkIntervalSeconds * MS_PER_SECOND;
    const timeSinceLastCheck = Date.now() - lastCheck;

    if (timeSinceLastCheck >= intervalMs) {
      await checkServerHealth(serverId);
      lastHealthCheckTime.set(serverId, Date.now());
    }
  }

  // プラグイン更新チェック
  if (config.pluginUpdate.enabled) {
    const pluginState = await getPluginUpdateState(serverId);
    if (shouldRunPluginCheck(config.pluginUpdate, pluginState, now)) {
      logger.info(`[AutomationScheduler] Running plugin update check for ${serverId}`);
      await checkPluginUpdates(serverId);
    }
  }
}

/**
 * サーバー起動時のイベントフック
 */
export async function onServerStart(serverId: string): Promise<void> {
  const { notifyServerStart } = await import('./discord');
  const { getServer } = await import('./config');
  const { runEventBackup } = await import('./autoBackup');

  const server = await getServer(serverId);
  if (!server) {
    return;
  }

  logger.info(`[AutomationScheduler] Server start event for ${server.name} (${serverId})`);

  // Discord通知
  await notifyServerStart(serverId, server.name);

  // 起動時バックアップ
  await runEventBackup(serverId, 'start');
}

/**
 * サーバー停止時のイベントフック
 */
export async function onServerStop(serverId: string): Promise<void> {
  const { notifyServerStop } = await import('./discord');
  const { getServer } = await import('./config');
  const { runEventBackup } = await import('./autoBackup');

  const server = await getServer(serverId);
  if (!server) {
    return;
  }

  logger.info(`[AutomationScheduler] Server stop event for ${server.name} (${serverId})`);

  // 停止時バックアップ（Discord通知は内部で行われる）
  await runEventBackup(serverId, 'stop');

  // Discord通知
  await notifyServerStop(serverId, server.name);
}

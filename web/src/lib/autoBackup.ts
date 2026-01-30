/**
 * 自動バックアップ機能
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AutoBackupConfig, BackupInfo, BackupState } from '@/types';
import { getAutomationConfig, getBackupState, saveBackupState } from './automation';
import { createBackup, createFullBackup, listBackups } from './backup';
import { getServer, getServerBackupPath } from './config';
import { INTERVAL_BACKUP_MIN_MS, INTERVAL_BACKUP_WEEKLY_MIN_MS, MS_PER_DAY } from './constants';
import { notifyBackupComplete } from './discord';
import { logger } from './logger';
import { formatSize } from './utils';

/**
 * 時刻文字列（HH:MM形式）をパースして分数を返す
 */
function parseTimeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return -1;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * 日時を分数（0時からの経過分）に変換
 */
function getTimeInMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * 次回スケジュールバックアップの日時を計算
 */
export function calculateNextBackupTime(config: AutoBackupConfig, now: Date): Date | null {
  if (!config.enabled) {
    return null;
  }

  const currentMinutes = getTimeInMinutes(now);
  const currentDay = now.getDay();

  if (config.scheduleType === 'daily') {
    const scheduledMinutes = parseTimeToMinutes(config.dailyTime);
    if (scheduledMinutes === -1) {
      return null;
    }

    const nextBackup = new Date(now);
    nextBackup.setSeconds(0, 0);

    if (currentMinutes >= scheduledMinutes) {
      // 今日の時刻を過ぎている場合は翌日
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    nextBackup.setHours(Math.floor(scheduledMinutes / 60), scheduledMinutes % 60);
    return nextBackup;
  } else {
    // weekly
    const scheduledMinutes = parseTimeToMinutes(config.weeklyTime);
    if (scheduledMinutes === -1) {
      return null;
    }

    const nextBackup = new Date(now);
    nextBackup.setSeconds(0, 0);

    // 目標曜日までの日数を計算
    let daysUntilTarget = config.weeklyDay - currentDay;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    } else if (daysUntilTarget === 0 && currentMinutes >= scheduledMinutes) {
      // 今日が目標曜日で時刻を過ぎている場合は来週
      daysUntilTarget = 7;
    }

    nextBackup.setDate(nextBackup.getDate() + daysUntilTarget);
    nextBackup.setHours(Math.floor(scheduledMinutes / 60), scheduledMinutes % 60);
    return nextBackup;
  }
}

/**
 * スケジュールバックアップを実行すべきかチェック
 */
export function shouldRunScheduledBackup(
  config: AutoBackupConfig,
  state: BackupState,
  now: Date
): boolean {
  if (!config.enabled) {
    return false;
  }

  const currentMinutes = getTimeInMinutes(now);
  const currentDay = now.getDay();

  // スケジュール時刻を取得
  let scheduledMinutes: number;
  let isCorrectDay = true;

  if (config.scheduleType === 'daily') {
    scheduledMinutes = parseTimeToMinutes(config.dailyTime);
  } else {
    scheduledMinutes = parseTimeToMinutes(config.weeklyTime);
    isCorrectDay = currentDay === config.weeklyDay;
  }

  if (scheduledMinutes === -1 || !isCorrectDay) {
    return false;
  }

  // 時刻が一致するかチェック（1分以内）
  if (Math.abs(currentMinutes - scheduledMinutes) > 1) {
    return false;
  }

  // 最終バックアップ時刻をチェック（同じ日に既に実行済みでないか）
  if (state.lastBackupTime) {
    const lastBackup = new Date(state.lastBackupTime);
    const timeSinceLastBackup = now.getTime() - lastBackup.getTime();

    // 日次の場合は23時間以内、週次の場合は6日以内に実行されていたらスキップ
    const minInterval =
      config.scheduleType === 'daily' ? INTERVAL_BACKUP_MIN_MS : INTERVAL_BACKUP_WEEKLY_MIN_MS;

    if (timeSinceLastBackup < minInterval) {
      return false;
    }
  }

  return true;
}

/**
 * スケジュールバックアップを実行
 */
export async function runScheduledBackup(serverId: string): Promise<BackupInfo | null> {
  const config = await getAutomationConfig(serverId);
  const server = await getServer(serverId);

  if (!server) {
    logger.error(`[AutoBackup] Server not found: ${serverId}`);
    return null;
  }

  if (!config.backup.enabled) {
    return null;
  }

  logger.info(`[AutoBackup] Running scheduled backup for ${server.name} (${serverId})`);

  let backup: BackupInfo | null = null;
  let success = false;

  try {
    if (config.backup.backupType === 'full') {
      backup = await createFullBackup(serverId);
    } else {
      backup = await createBackup(serverId);
    }
    success = true;
    logger.info(`[AutoBackup] Backup completed: ${backup.filename}`);
  } catch (error) {
    logger.error(`[AutoBackup] Backup failed for ${serverId}:`, error);
  }

  // 状態を更新
  const state = await getBackupState(serverId);
  state.lastBackupTime = new Date().toISOString();
  state.lastBackupType = config.backup.backupType;
  state.lastBackupSuccess = success;
  state.nextScheduledBackup =
    calculateNextBackupTime(config.backup, new Date())?.toISOString() || null;
  await saveBackupState(serverId, state);

  // Discord通知
  await notifyBackupComplete(
    serverId,
    server.name,
    config.backup.backupType,
    backup ? formatSize(backup.size) : '-',
    success
  );

  // 古いバックアップをクリーンアップ
  if (success) {
    await cleanupOldBackups(serverId, config.backup.retention);
  }

  return backup;
}

/**
 * サーバー起動/停止時のバックアップを実行
 */
export async function runEventBackup(
  serverId: string,
  event: 'start' | 'stop'
): Promise<BackupInfo | null> {
  const config = await getAutomationConfig(serverId);
  const server = await getServer(serverId);

  if (!server) {
    return null;
  }

  // 起動時/停止時バックアップが有効かチェック
  if (event === 'start' && !config.backup.backupOnStart) {
    return null;
  }
  if (event === 'stop' && !config.backup.backupOnStop) {
    return null;
  }

  logger.info(`[AutoBackup] Running ${event} backup for ${server.name} (${serverId})`);

  let backup: BackupInfo | null = null;
  let success = false;

  try {
    if (config.backup.backupType === 'full') {
      backup = await createFullBackup(serverId);
    } else {
      backup = await createBackup(serverId);
    }
    success = true;
    logger.info(`[AutoBackup] ${event} backup completed: ${backup.filename}`);
  } catch (error) {
    logger.error(`[AutoBackup] ${event} backup failed for ${serverId}:`, error);
  }

  // 状態を更新
  const state = await getBackupState(serverId);
  state.lastBackupTime = new Date().toISOString();
  state.lastBackupType = config.backup.backupType;
  state.lastBackupSuccess = success;
  await saveBackupState(serverId, state);

  // Discord通知（停止時のみ、起動時は不要）
  if (event === 'stop') {
    await notifyBackupComplete(
      serverId,
      server.name,
      config.backup.backupType,
      backup ? formatSize(backup.size) : '-',
      success
    );
  }

  return backup;
}

/**
 * 古いバックアップを削除
 */
export async function cleanupOldBackups(
  serverId: string,
  retention: { maxCount: number; maxAgeDays: number }
): Promise<number> {
  const backups = await listBackups(serverId);
  const backupPath = getServerBackupPath(serverId);

  if (backups.length === 0) {
    return 0;
  }

  const now = new Date();
  const maxAgeMs = retention.maxAgeDays * MS_PER_DAY;
  let deletedCount = 0;

  // 新しい順にソート
  const sortedBackups = [...backups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (let i = 0; i < sortedBackups.length; i++) {
    const backup = sortedBackups[i];
    const backupAge = now.getTime() - new Date(backup.createdAt).getTime();

    // 保持数を超えている、または期限切れの場合は削除
    const exceedsCount = i >= retention.maxCount;
    const exceedsAge = backupAge > maxAgeMs;

    if (exceedsCount || exceedsAge) {
      try {
        await fs.unlink(path.join(backupPath, backup.filename));
        deletedCount++;
        logger.info(
          `[AutoBackup] Deleted old backup: ${backup.filename} (reason: ${exceedsCount ? 'count' : 'age'})`
        );
      } catch (error) {
        logger.error(`[AutoBackup] Failed to delete backup ${backup.filename}:`, error);
      }
    }
  }

  if (deletedCount > 0) {
    logger.info(`[AutoBackup] Cleaned up ${deletedCount} old backups for server ${serverId}`);
  }

  return deletedCount;
}

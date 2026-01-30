import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ServerSchedule } from '@/types';
import { DEFAULT_SERVER_SCHEDULE } from '@/types';
import { runAutomationTick } from './automationScheduler';
import { getAllServers } from './config';
import { DAYS_PER_WEEK, MINUTES_PER_DAY, MS_PER_MINUTE } from './constants';
import { getServerStatus, startServer, stopServer } from './docker';
import { logger } from './logger';

const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(process.cwd(), '..');
const SERVERS_DIR = path.join(PROJECT_ROOT, 'servers');
const SCHEDULE_FILE = 'schedule.json';
const SCHEDULER_INTERVAL_MS = MS_PER_MINUTE;

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * HH:MM形式の時刻を分に変換する
 * @param time "HH:MM" format (e.g., "20:00", "24:00")
 * @returns 0時からの経過分数、無効な場合は-1
 */
export function parseTime(time: string): number {
  if (!time || typeof time !== 'string') {
    return -1;
  }

  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return -1;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // 24:00は特別に許可（翌日0:00として扱う）
  if (hours === 24 && minutes === 0) {
    return MINUTES_PER_DAY;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return -1;
  }

  return hours * 60 + minutes;
}

/**
 * 特定の曜日のスケジュールが現在時刻に該当するかチェック
 */
function checkDaySchedule(
  daySchedule: { enabled: boolean; startTime: string; endTime: string } | undefined,
  currentMinutes: number,
  isYesterday: boolean
): boolean {
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }

  const startMinutes = parseTime(daySchedule.startTime);
  const endMinutes = parseTime(daySchedule.endTime);

  if (startMinutes === -1 || endMinutes === -1) {
    return false;
  }

  // 24:00開始は0:00として扱う
  const effectiveStartMinutes = startMinutes === MINUTES_PER_DAY ? 0 : startMinutes;

  // 日をまたぐスケジュール (例: 22:00 - 02:00 または 24:00 - 01:00)
  const crossesMidnight = effectiveStartMinutes >= endMinutes || startMinutes === MINUTES_PER_DAY;

  if (isYesterday) {
    // 前日のスケジュールをチェック: 日をまたいでいる場合のみ、終了時刻未満かどうか
    if (crossesMidnight) {
      return currentMinutes < endMinutes;
    }
    return false;
  }

  // 当日のスケジュールをチェック
  if (crossesMidnight) {
    // 開始時刻以降（終了時刻未満は翌日に判定される）
    return currentMinutes >= effectiveStartMinutes;
  }

  // 通常の場合 (例: 09:00 - 17:00)
  return currentMinutes >= effectiveStartMinutes && currentMinutes < endMinutes;
}

/**
 * 指定された日時がスケジュールの稼働時間内かどうかを判定する
 * @param schedule サーバースケジュール設定
 * @param date 判定する日時
 * @returns 稼働時間内ならtrue
 */
export function isWithinSchedule(schedule: ServerSchedule, date: Date): boolean {
  if (!schedule.enabled) {
    return false;
  }

  // タイムゾーンを考慮した現地時刻を取得
  const localTime = new Date(date.toLocaleString('en-US', { timeZone: schedule.timezone }));
  const dayOfWeek = localTime.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();

  // 当日のスケジュールをチェック
  const todaySchedule = schedule.weeklySchedule[dayOfWeek];
  if (checkDaySchedule(todaySchedule, currentMinutes, false)) {
    return true;
  }

  // 前日のスケジュールが日をまたいでいる場合をチェック
  // (例: 木曜24:00-01:00 → 金曜0:00-1:00も有効)
  const yesterdayIndex = dayOfWeek === 0 ? DAYS_PER_WEEK - 1 : dayOfWeek - 1;
  const yesterdaySchedule = schedule.weeklySchedule[yesterdayIndex];
  if (checkDaySchedule(yesterdaySchedule, currentMinutes, true)) {
    return true;
  }

  return false;
}

/**
 * スケジュール設定ファイルのパスを取得
 */
export function getSchedulePath(serverId: string): string {
  return path.join(SERVERS_DIR, serverId, SCHEDULE_FILE);
}

/**
 * サーバーのスケジュール設定を読み込む
 */
export async function getSchedule(serverId: string): Promise<ServerSchedule> {
  const schedulePath = getSchedulePath(serverId);
  try {
    const data = await fs.readFile(schedulePath, 'utf-8');
    return JSON.parse(data) as ServerSchedule;
  } catch {
    return { ...DEFAULT_SERVER_SCHEDULE };
  }
}

/**
 * サーバーのスケジュール設定を保存する
 */
export async function saveSchedule(serverId: string, schedule: ServerSchedule): Promise<void> {
  const schedulePath = getSchedulePath(serverId);
  const dir = path.dirname(schedulePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
}

/**
 * スケジューラーのメインループを実行
 */
async function runSchedulerTick(): Promise<void> {
  try {
    const servers = await getAllServers();
    const now = new Date();

    for (const server of servers) {
      try {
        const schedule = await getSchedule(server.id);
        if (!schedule.enabled) continue;

        const shouldRun = isWithinSchedule(schedule, now);
        const status = await getServerStatus(server.id);
        const isRunning = status.running;

        if (shouldRun && !isRunning) {
          logger.info(`[Scheduler] Starting server: ${server.name} (${server.id})`);
          await startServer(server.id);
        } else if (!shouldRun && isRunning) {
          logger.info(`[Scheduler] Stopping server: ${server.name} (${server.id})`);
          await stopServer(server.id);
        }
      } catch (error) {
        logger.error(`[Scheduler] Error processing server ${server.id}:`, error);
      }
    }

    // オートメーションタスクを実行
    await runAutomationTick();
  } catch (error) {
    logger.error('[Scheduler] Error in scheduler tick:', error);
  }
}

/**
 * スケジューラーを開始する
 */
export function startScheduler(): void {
  if (schedulerInterval) {
    logger.warn('[Scheduler] Scheduler is already running');
    return;
  }

  logger.info('[Scheduler] Starting scheduler (interval: 1 minute)');

  // 初回は即時実行
  runSchedulerTick();

  // 1分ごとにチェック
  schedulerInterval = setInterval(runSchedulerTick, SCHEDULER_INTERVAL_MS);
}

/**
 * スケジューラーを停止する
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('[Scheduler] Scheduler stopped');
  }
}

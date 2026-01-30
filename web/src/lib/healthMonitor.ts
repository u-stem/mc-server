/**
 * ヘルスモニタリング＆自動再起動
 */
import type { HealthCheckConfig, HealthState, TpsInfo } from '@/types';
import { getAutomationConfig, getHealthState, saveHealthState } from './automation';
import { getServer } from './config';
import {
  CRASH_DETECTION_WINDOW_MS,
  MEMORY_CRITICAL_PERCENT,
  MS_PER_MINUTE,
  TPS_CRITICAL_RATIO,
} from './constants';
import { notifyAutoRestart, notifyHealthAlert, notifyServerCrash } from './discord';
import { getServerStatus, restartServer } from './docker';
import { logger } from './logger';

/**
 * メモリ使用率をパーセントで計算
 */
export function parseMemoryPercent(memory: { used: string; total: string }): number {
  const parseSize = (str: string): number => {
    const match = str.match(/^([\d.]+)\s*([KMGT]?i?B)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers: Record<string, number> = {
      B: 1,
      KB: 1024,
      KIB: 1024,
      MB: 1024 * 1024,
      MIB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      GIB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
      TIB: 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  };

  const usedBytes = parseSize(memory.used);
  const totalBytes = parseSize(memory.total);

  if (totalBytes === 0) return 0;
  return (usedBytes / totalBytes) * 100;
}

/**
 * ヘルス状態を評価
 */
export function evaluateHealth(
  tps: TpsInfo | null,
  memoryPercent: number | null,
  config: HealthCheckConfig
): { status: 'healthy' | 'warning' | 'critical'; reason?: string } {
  // TPS チェック
  if (tps) {
    const currentTps = tps.tps1m;
    if (currentTps < config.tpsThreshold) {
      const severity =
        currentTps < config.tpsThreshold * TPS_CRITICAL_RATIO ? 'critical' : 'warning';
      return {
        status: severity,
        reason: `TPS低下: ${currentTps.toFixed(1)} (閾値: ${config.tpsThreshold})`,
      };
    }
  }

  // メモリ チェック
  if (memoryPercent !== null) {
    if (memoryPercent >= config.memoryThresholdPercent) {
      const severity = memoryPercent >= MEMORY_CRITICAL_PERCENT ? 'critical' : 'warning';
      return {
        status: severity,
        reason: `メモリ使用率高: ${memoryPercent.toFixed(1)}% (閾値: ${config.memoryThresholdPercent}%)`,
      };
    }
  }

  return { status: 'healthy' };
}

/**
 * サーバーのヘルスチェックを実行
 */
export async function checkServerHealth(serverId: string): Promise<HealthState> {
  const config = await getAutomationConfig(serverId);
  const server = await getServer(serverId);
  const state = await getHealthState(serverId);

  if (!server || !config.healthCheck.enabled) {
    return state;
  }

  const now = new Date().toISOString();
  const status = await getServerStatus(serverId);

  // サーバーが停止している場合
  if (!status.running) {
    // クラッシュ検出：前回は動いていたのに今は停止している場合
    if (state.currentStatus !== 'unknown' && state.lastCheckTime) {
      const lastCheck = new Date(state.lastCheckTime);
      const timeSinceLastCheck = Date.now() - lastCheck.getTime();

      // 意図的な停止かどうかを確認
      const { isIntentionalStop } = await import('./automationScheduler');
      const wasIntentional = isIntentionalStop(serverId);

      // 前回チェックから短時間で停止 かつ 意図的でない = クラッシュの可能性
      if (
        timeSinceLastCheck < CRASH_DETECTION_WINDOW_MS &&
        config.healthCheck.crashDetection &&
        !wasIntentional
      ) {
        logger.warn(`[HealthMonitor] Possible crash detected for ${server.name}`);
        await notifyServerCrash(serverId, server.name, '予期しないサーバー停止');

        // 自動再起動が有効で、クールダウン中でなければ再起動
        if (config.healthCheck.autoRestart && shouldAutoRestart(state, config.healthCheck)) {
          await performAutoRestart(
            serverId,
            server.name,
            'クラッシュ検出',
            state,
            config.healthCheck
          );
        }
      }
    }

    state.lastCheckTime = now;
    state.currentStatus = 'unknown';
    state.consecutiveFailures = 0;
    await saveHealthState(serverId, state);
    return state;
  }

  // TPS取得
  const tps = status.tps || null;

  // メモリ使用率計算
  let memoryPercent: number | null = null;
  if (status.memory) {
    memoryPercent = parseMemoryPercent(status.memory);
  }

  // ヘルス状態を評価
  const evaluation = evaluateHealth(tps, memoryPercent, config.healthCheck);

  // 状態を更新
  state.lastCheckTime = now;
  state.lastTps = tps?.tps1m ?? null;
  state.lastMemoryPercent = memoryPercent;

  if (evaluation.status === 'healthy') {
    state.currentStatus = 'healthy';
    state.consecutiveFailures = 0;
  } else {
    state.currentStatus = evaluation.status;
    state.consecutiveFailures++;

    // アラート通知
    if (state.consecutiveFailures === 1) {
      // 最初の失敗時にアラート送信
      if (tps && tps.tps1m < config.healthCheck.tpsThreshold) {
        await notifyHealthAlert(
          serverId,
          server.name,
          'tps',
          tps.tps1m,
          config.healthCheck.tpsThreshold,
          evaluation.status === 'critical' ? 'critical' : 'warning'
        );
      } else if (
        memoryPercent !== null &&
        memoryPercent >= config.healthCheck.memoryThresholdPercent
      ) {
        await notifyHealthAlert(
          serverId,
          server.name,
          'memory',
          memoryPercent,
          config.healthCheck.memoryThresholdPercent,
          evaluation.status === 'critical' ? 'critical' : 'warning'
        );
      }
    }

    // 自動再起動チェック
    if (
      config.healthCheck.autoRestart &&
      state.consecutiveFailures >= config.healthCheck.consecutiveFailures &&
      shouldAutoRestart(state, config.healthCheck)
    ) {
      await performAutoRestart(
        serverId,
        server.name,
        evaluation.reason || 'パフォーマンス低下',
        state,
        config.healthCheck
      );
    }
  }

  await saveHealthState(serverId, state);
  return state;
}

/**
 * 自動再起動を実行すべきかチェック
 */
function shouldAutoRestart(state: HealthState, config: HealthCheckConfig): boolean {
  if (!state.lastRestartTime) {
    return true;
  }

  const lastRestart = new Date(state.lastRestartTime);
  const cooldownMs = config.restartCooldownMinutes * MS_PER_MINUTE;
  const timeSinceLastRestart = Date.now() - lastRestart.getTime();

  return timeSinceLastRestart >= cooldownMs;
}

/**
 * 自動再起動を実行
 */
async function performAutoRestart(
  serverId: string,
  serverName: string,
  reason: string,
  state: HealthState,
  _config: HealthCheckConfig
): Promise<void> {
  logger.info(`[HealthMonitor] Auto-restarting ${serverName} (${serverId}): ${reason}`);

  try {
    await restartServer(serverId);

    state.lastRestartTime = new Date().toISOString();
    state.consecutiveFailures = 0;

    await notifyAutoRestart(serverId, serverName, reason);
  } catch (error) {
    logger.error(`[HealthMonitor] Auto-restart failed for ${serverId}:`, error);
  }
}

/**
 * サーバーのヘルス状態を取得（API用）
 */
export async function getServerHealthStatus(serverId: string): Promise<{
  enabled: boolean;
  state: HealthState;
  config: HealthCheckConfig;
}> {
  const config = await getAutomationConfig(serverId);
  const state = await getHealthState(serverId);

  return {
    enabled: config.healthCheck.enabled,
    state,
    config: config.healthCheck,
  };
}

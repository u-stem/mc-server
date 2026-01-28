import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ServerStatus } from '@/types';
import { getServerComposePath } from './config';
import {
  DEFAULT_LOG_LINES,
  DEFAULT_SERVER_ID,
  MAX_LOG_LINES,
  TIMEOUT_DOCKER_COMPOSE_MS,
  TIMEOUT_DOCKER_INSPECT_MS,
  TIMEOUT_DOCKER_LOGS_MS,
  TIMEOUT_DOCKER_STATS_MS,
} from './constants';
import { validateServerId } from './validation';

const execFileAsync = promisify(execFile);

// Docker Compose コマンドを実行（execFile使用でインジェクション防止）
async function runDockerCompose(
  serverId: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const composePath = getServerComposePath(serverId);
  const composeDir = path.dirname(composePath);

  try {
    return await execFileAsync('docker', ['compose', '-f', composePath, ...args], {
      cwd: composeDir,
      timeout: TIMEOUT_DOCKER_COMPOSE_MS,
    });
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(execError.stderr || execError.message || 'Docker command failed');
  }
}

// サーバー起動
export async function startServer(serverId: string): Promise<void> {
  await runDockerCompose(serverId, ['up', '-d']);
}

// サーバー停止
export async function stopServer(serverId: string): Promise<void> {
  await runDockerCompose(serverId, ['down']);
}

// サーバー再起動
export async function restartServer(serverId: string): Promise<void> {
  await runDockerCompose(serverId, ['restart']);
}

// コンテナを再作成（設定変更後に使用）
export async function recreateServer(serverId: string): Promise<void> {
  await runDockerCompose(serverId, ['up', '-d', '--force-recreate']);
}

// コンテナ名を取得（バリデーション済みのサーバーIDから安全に生成）
function getContainerName(serverId: string): string {
  // サーバーIDはバリデーション済みなので安全
  if (serverId === DEFAULT_SERVER_ID) {
    return 'mc-server';
  }
  return `mc-${serverId}`;
}

// サーバーステータス取得
export async function getServerStatus(serverId: string): Promise<ServerStatus> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const containerName = getContainerName(serverId);

  try {
    // execFileを使用してコマンドインジェクションを防止
    const { stdout } = await execFileAsync(
      'docker',
      ['inspect', '--format={{.State.Running}}\t{{.State.StartedAt}}', containerName],
      { timeout: TIMEOUT_DOCKER_INSPECT_MS }
    );

    const [runningStr, startedAtStr] = stdout.trim().split('\t');
    const running = runningStr === 'true';

    if (!running) {
      return {
        running: false,
        players: { online: 0, max: 0, list: [] },
      };
    }

    // 稼働時間を計算
    const startedAt = new Date(startedAtStr);
    const uptime = formatUptime(Date.now() - startedAt.getTime());

    // CPU・メモリ使用量を取得
    let cpu: string | undefined;
    let memory: { used: string; total: string } | undefined;

    try {
      const { stdout: statsOutput } = await execFileAsync(
        'docker',
        ['stats', '--no-stream', '--format={{.CPUPerc}}\t{{.MemUsage}}', containerName],
        { timeout: TIMEOUT_DOCKER_STATS_MS }
      );
      const [cpuStr, memStr] = statsOutput.trim().split('\t');
      cpu = cpuStr || undefined;
      const memParts = memStr?.split(' / ');
      if (memParts && memParts.length === 2) {
        memory = { used: memParts[0], total: memParts[1] };
      }
    } catch {
      // stats取得失敗は無視
    }

    return {
      running: true,
      players: { online: 0, max: 0, list: [] },
      uptime,
      cpu,
      memory,
    };
  } catch {
    return {
      running: false,
      players: { online: 0, max: 0, list: [] },
    };
  }
}

// コンテナログを取得
export async function getServerLogs(
  serverId: string,
  lines: number = DEFAULT_LOG_LINES
): Promise<string> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // lines を数値として検証
  const safeLines = Math.max(1, Math.min(MAX_LOG_LINES, Math.floor(lines)));

  const containerName = getContainerName(serverId);

  try {
    const { stdout, stderr } = await execFileAsync(
      'docker',
      ['logs', '--tail', String(safeLines), containerName],
      { timeout: TIMEOUT_DOCKER_LOGS_MS }
    );
    return stdout + stderr;
  } catch (error) {
    const execError = error as { message?: string };
    // コンテナが存在しない場合は空文字を返す
    if (execError.message?.includes('No such container')) {
      return '';
    }
    throw new Error(`Failed to get logs: ${execError.message}`);
  }
}

// コンテナ情報を取得
export async function getContainerInfo(serverId: string): Promise<{
  status: string;
  uptime?: string;
  memory?: { used: string; total: string };
  cpu?: string;
} | null> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const containerName = getContainerName(serverId);

  try {
    const { stdout: statusOutput } = await execFileAsync(
      'docker',
      ['inspect', '--format={{.State.Status}}', containerName],
      { timeout: TIMEOUT_DOCKER_INSPECT_MS }
    );

    const status = statusOutput.trim();

    if (status !== 'running') {
      return { status };
    }

    // 起動時刻を取得
    const { stdout: startedAtOutput } = await execFileAsync(
      'docker',
      ['inspect', '--format={{.State.StartedAt}}', containerName],
      { timeout: TIMEOUT_DOCKER_INSPECT_MS }
    );
    const startedAt = new Date(startedAtOutput.trim());
    const uptime = formatUptime(Date.now() - startedAt.getTime());

    // CPU・メモリ使用量を取得
    const { stdout: statsOutput } = await execFileAsync(
      'docker',
      ['stats', '--no-stream', '--format={{.CPUPerc}}\t{{.MemUsage}}', containerName],
      { timeout: TIMEOUT_DOCKER_STATS_MS }
    );
    const [cpuStr, memStr] = statsOutput.trim().split('\t');

    const cpu = cpuStr || undefined;
    const memParts = memStr?.split(' / ');
    const memory =
      memParts && memParts.length === 2 ? { used: memParts[0], total: memParts[1] } : undefined;

    return { status, uptime, memory, cpu };
  } catch {
    return null;
  }
}

// 稼働時間をフォーマット
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

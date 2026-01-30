/**
 * オートメーション設定管理
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  AutomationConfig,
  BackupState,
  HealthState,
  PluginUpdateState,
} from '@/types/automation';
import {
  DEFAULT_AUTOMATION_CONFIG,
  DEFAULT_BACKUP_STATE,
  DEFAULT_HEALTH_STATE,
  DEFAULT_PLUGIN_UPDATE_STATE,
} from '@/types/automation';
import {
  FILE_AUTOMATION,
  FILE_BACKUP_STATE,
  FILE_HEALTH_STATE,
  FILE_PLUGIN_UPDATES,
} from './constants';
import { validateServerId } from './validation';

const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(process.cwd(), '..');
const SERVERS_DIR = path.join(PROJECT_ROOT, 'servers');

/**
 * サーバーのオートメーション設定ファイルパスを取得
 */
export function getAutomationPath(serverId: string): string {
  return path.join(SERVERS_DIR, serverId, FILE_AUTOMATION);
}

/**
 * サーバーのバックアップ状態ファイルパスを取得
 */
export function getBackupStatePath(serverId: string): string {
  return path.join(SERVERS_DIR, serverId, FILE_BACKUP_STATE);
}

/**
 * サーバーのヘルス状態ファイルパスを取得
 */
export function getHealthStatePath(serverId: string): string {
  return path.join(SERVERS_DIR, serverId, FILE_HEALTH_STATE);
}

/**
 * サーバーのプラグイン更新状態ファイルパスを取得
 */
export function getPluginUpdateStatePath(serverId: string): string {
  return path.join(SERVERS_DIR, serverId, FILE_PLUGIN_UPDATES);
}

/**
 * オートメーション設定を読み込む
 */
export async function getAutomationConfig(serverId: string): Promise<AutomationConfig> {
  validateServerId(serverId);

  const configPath = getAutomationPath(serverId);
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data) as Partial<AutomationConfig>;

    // デフォルト値とマージ（不足しているプロパティを補完）
    return {
      discord: { ...DEFAULT_AUTOMATION_CONFIG.discord, ...config.discord },
      backup: { ...DEFAULT_AUTOMATION_CONFIG.backup, ...config.backup },
      pluginUpdate: { ...DEFAULT_AUTOMATION_CONFIG.pluginUpdate, ...config.pluginUpdate },
      healthCheck: { ...DEFAULT_AUTOMATION_CONFIG.healthCheck, ...config.healthCheck },
    };
  } catch {
    return { ...DEFAULT_AUTOMATION_CONFIG };
  }
}

/**
 * オートメーション設定を保存する
 */
export async function saveAutomationConfig(
  serverId: string,
  config: AutomationConfig
): Promise<void> {
  validateServerId(serverId);

  const configPath = getAutomationPath(serverId);
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * バックアップ状態を読み込む
 */
export async function getBackupState(serverId: string): Promise<BackupState> {
  validateServerId(serverId);

  const statePath = getBackupStatePath(serverId);
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    return { ...DEFAULT_BACKUP_STATE, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_BACKUP_STATE };
  }
}

/**
 * バックアップ状態を保存する
 */
export async function saveBackupState(serverId: string, state: BackupState): Promise<void> {
  validateServerId(serverId);

  const statePath = getBackupStatePath(serverId);
  const dir = path.dirname(statePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * ヘルス状態を読み込む
 */
export async function getHealthState(serverId: string): Promise<HealthState> {
  validateServerId(serverId);

  const statePath = getHealthStatePath(serverId);
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    return { ...DEFAULT_HEALTH_STATE, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_HEALTH_STATE };
  }
}

/**
 * ヘルス状態を保存する
 */
export async function saveHealthState(serverId: string, state: HealthState): Promise<void> {
  validateServerId(serverId);

  const statePath = getHealthStatePath(serverId);
  const dir = path.dirname(statePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * プラグイン更新状態を読み込む
 */
export async function getPluginUpdateState(serverId: string): Promise<PluginUpdateState> {
  validateServerId(serverId);

  const statePath = getPluginUpdateStatePath(serverId);
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    return { ...DEFAULT_PLUGIN_UPDATE_STATE, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_PLUGIN_UPDATE_STATE };
  }
}

/**
 * プラグイン更新状態を保存する
 */
export async function savePluginUpdateState(
  serverId: string,
  state: PluginUpdateState
): Promise<void> {
  validateServerId(serverId);

  const statePath = getPluginUpdateStatePath(serverId);
  const dir = path.dirname(statePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

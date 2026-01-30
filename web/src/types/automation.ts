/**
 * オートメーション関連の型定義
 */

// アラート閾値設定
export interface AlertThresholds {
  tpsWarning: number; // TPS警告閾値（例: 18）
  tpsCritical: number; // TPS危険閾値（例: 15）
  memoryWarning: number; // メモリ使用率警告閾値（%）
  memoryCritical: number; // メモリ使用率危険閾値（%）
}

// Discord Webhook設定
// ※プレイヤー参加/退出はDiscordプラグイン（DiscordSRV等）に任せる
export interface DiscordWebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  notifyOnStart: boolean; // サーバー起動
  notifyOnStop: boolean; // サーバー停止
  notifyOnCrash: boolean; // クラッシュ検出
  notifyOnAlert: boolean; // ヘルスアラート（TPS/メモリ）
  notifyOnBackup: boolean; // バックアップ完了
  notifyOnPluginUpdate: boolean; // プラグイン更新検出
  alertThresholds: AlertThresholds;
}

// 自動バックアップ設定
export interface AutoBackupConfig {
  enabled: boolean;
  scheduleType: 'daily' | 'weekly';
  dailyTime: string; // "HH:MM" 形式
  weeklyDay: number; // 0=日曜, 1=月曜, ..., 6=土曜
  weeklyTime: string; // "HH:MM" 形式
  backupOnStart: boolean; // サーバー起動時にバックアップ
  backupOnStop: boolean; // サーバー停止時にバックアップ
  retention: {
    maxCount: number; // 保持する最大バックアップ数
    maxAgeDays: number; // 保持する最大日数
  };
  backupType: 'world' | 'full'; // world: ワールドのみ、full: 全ファイル
}

// プラグイン自動更新設定
export interface PluginAutoUpdateConfig {
  enabled: boolean;
  checkIntervalHours: number; // 更新チェック間隔（時間）
  autoInstall: boolean; // 自動インストール
  notifyOnUpdate: boolean; // 更新検出時に通知
  excludePlugins: string[]; // 除外するプラグイン名
}

// ヘルスチェック設定
export interface HealthCheckConfig {
  enabled: boolean;
  checkIntervalSeconds: number; // チェック間隔（秒）
  tpsThreshold: number; // TPS閾値（これ以下で警告/再起動）
  memoryThresholdPercent: number; // メモリ使用率閾値（%）
  consecutiveFailures: number; // 再起動トリガーまでの連続失敗回数
  autoRestart: boolean; // 自動再起動を有効化
  restartCooldownMinutes: number; // 再起動クールダウン（分）
  crashDetection: boolean; // クラッシュ検出を有効化
}

// オートメーション設定全体
export interface AutomationConfig {
  discord: DiscordWebhookConfig;
  backup: AutoBackupConfig;
  pluginUpdate: PluginAutoUpdateConfig;
  healthCheck: HealthCheckConfig;
}

// バックアップ状態
export interface BackupState {
  lastBackupTime: string | null; // ISO 8601形式
  lastBackupType: 'world' | 'full' | 'manual' | null;
  lastBackupSuccess: boolean;
  nextScheduledBackup: string | null; // ISO 8601形式
}

// ヘルス状態
export interface HealthState {
  lastCheckTime: string | null; // ISO 8601形式
  consecutiveFailures: number;
  lastRestartTime: string | null; // ISO 8601形式
  currentStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastTps: number | null;
  lastMemoryPercent: number | null;
}

// プラグイン更新情報
export interface PluginUpdateInfo {
  pluginName: string;
  currentVersion: string;
  latestVersion: string;
  modrinthProjectId: string | null;
  updateAvailable: boolean;
  lastChecked: string; // ISO 8601形式
}

// プラグイン更新状態
export interface PluginUpdateState {
  lastCheckTime: string | null; // ISO 8601形式
  updates: PluginUpdateInfo[];
}

// Discord通知の種類
export type DiscordNotificationType =
  | 'server_start'
  | 'server_stop'
  | 'server_crash'
  | 'health_alert'
  | 'backup_complete'
  | 'plugin_update';

// Discord Embed
export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number; // 16進数カラーコード
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string; // ISO 8601形式
}

// デフォルト設定
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  tpsWarning: 18,
  tpsCritical: 15,
  memoryWarning: 80,
  memoryCritical: 90,
};

export const DEFAULT_DISCORD_CONFIG: DiscordWebhookConfig = {
  enabled: false,
  webhookUrl: '',
  notifyOnStart: true,
  notifyOnStop: true,
  notifyOnCrash: true,
  notifyOnAlert: true,
  notifyOnBackup: true,
  notifyOnPluginUpdate: true,
  alertThresholds: DEFAULT_ALERT_THRESHOLDS,
};

export const DEFAULT_AUTO_BACKUP_CONFIG: AutoBackupConfig = {
  enabled: false,
  scheduleType: 'daily',
  dailyTime: '04:00',
  weeklyDay: 0, // 日曜日
  weeklyTime: '04:00',
  backupOnStart: false,
  backupOnStop: true,
  retention: {
    maxCount: 7,
    maxAgeDays: 30,
  },
  backupType: 'world',
};

export const DEFAULT_PLUGIN_UPDATE_CONFIG: PluginAutoUpdateConfig = {
  enabled: false,
  checkIntervalHours: 24,
  autoInstall: false,
  notifyOnUpdate: true,
  excludePlugins: [],
};

export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  enabled: false,
  checkIntervalSeconds: 60,
  tpsThreshold: 15,
  memoryThresholdPercent: 90,
  consecutiveFailures: 3,
  autoRestart: false,
  restartCooldownMinutes: 10,
  crashDetection: true,
};

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  discord: DEFAULT_DISCORD_CONFIG,
  backup: DEFAULT_AUTO_BACKUP_CONFIG,
  pluginUpdate: DEFAULT_PLUGIN_UPDATE_CONFIG,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
};

export const DEFAULT_BACKUP_STATE: BackupState = {
  lastBackupTime: null,
  lastBackupType: null,
  lastBackupSuccess: false,
  nextScheduledBackup: null,
};

export const DEFAULT_HEALTH_STATE: HealthState = {
  lastCheckTime: null,
  consecutiveFailures: 0,
  lastRestartTime: null,
  currentStatus: 'unknown',
  lastTps: null,
  lastMemoryPercent: null,
};

export const DEFAULT_PLUGIN_UPDATE_STATE: PluginUpdateState = {
  lastCheckTime: null,
  updates: [],
};

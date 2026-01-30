/**
 * Discord Webhook通知
 *
 * 管理イベントの通知
 */
import type { DiscordEmbed, DiscordNotificationType, DiscordWebhookConfig } from '@/types';
import { getAutomationConfig } from './automation';
import { DISCORD_COLORS } from './constants';
import { logger } from './logger';

/**
 * Discord Webhook URLが有効かどうかを検証
 * SSRF対策として、discord.comまたはdiscordapp.comのWebhook URLのみを許可
 */
export function isValidDiscordWebhookUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const isDiscordHost = parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com';
    return (
      parsed.protocol === 'https:' && isDiscordHost && parsed.pathname.startsWith('/api/webhooks/')
    );
  } catch {
    return false;
  }
}

/**
 * Discord Webhookに通知を送信
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  embed: DiscordEmbed
): Promise<boolean> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    logger.warn('[Discord] Invalid webhook URL rejected');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            ...embed,
            timestamp: embed.timestamp || new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.error(
        `[Discord] Failed to send notification: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Discord] Error sending notification:', error);
    return false;
  }
}

// 通知タイプから設定プロパティへのマッピング
const NOTIFICATION_CONFIG_MAP: Record<
  DiscordNotificationType,
  keyof Pick<
    DiscordWebhookConfig,
    | 'notifyOnStart'
    | 'notifyOnStop'
    | 'notifyOnCrash'
    | 'notifyOnAlert'
    | 'notifyOnBackup'
    | 'notifyOnPluginUpdate'
  >
> = {
  server_start: 'notifyOnStart',
  server_stop: 'notifyOnStop',
  server_crash: 'notifyOnCrash',
  health_alert: 'notifyOnAlert',
  backup_complete: 'notifyOnBackup',
  plugin_update: 'notifyOnPluginUpdate',
};

/**
 * 通知タイプが有効かどうかをチェック
 */
function isNotificationEnabled(
  config: DiscordWebhookConfig,
  type: DiscordNotificationType
): boolean {
  if (!config.enabled || !config.webhookUrl) {
    return false;
  }
  return config[NOTIFICATION_CONFIG_MAP[type]] ?? false;
}

/**
 * サーバー起動通知を送信
 */
export async function notifyServerStart(serverId: string, serverName: string): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'server_start')) {
    return false;
  }

  const embed: DiscordEmbed = {
    title: '🟢 サーバー起動',
    description: `**${serverName}** が起動しました`,
    color: DISCORD_COLORS.SUCCESS,
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * サーバー停止通知を送信
 */
export async function notifyServerStop(serverId: string, serverName: string): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'server_stop')) {
    return false;
  }

  const embed: DiscordEmbed = {
    title: '🔴 サーバー停止',
    description: `**${serverName}** が停止しました`,
    color: DISCORD_COLORS.INFO,
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * サーバークラッシュ通知を送信
 */
export async function notifyServerCrash(
  serverId: string,
  serverName: string,
  reason?: string
): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'server_crash')) {
    return false;
  }

  const embed: DiscordEmbed = {
    title: '💥 サーバークラッシュ検出',
    description: `**${serverName}** がクラッシュした可能性があります`,
    color: DISCORD_COLORS.ERROR,
    fields: reason
      ? [
          {
            name: '原因',
            value: reason,
            inline: false,
          },
        ]
      : undefined,
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * ヘルスアラート通知を送信
 */
export async function notifyHealthAlert(
  serverId: string,
  serverName: string,
  alertType: 'tps' | 'memory',
  currentValue: number,
  threshold: number,
  severity: 'warning' | 'critical'
): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'health_alert')) {
    return false;
  }

  const alertTitle = alertType === 'tps' ? 'TPS低下' : 'メモリ使用率高';
  const unit = alertType === 'tps' ? '' : '%';
  const icon = severity === 'critical' ? '🚨' : '⚠️';
  const color = severity === 'critical' ? DISCORD_COLORS.ERROR : DISCORD_COLORS.WARNING;

  const embed: DiscordEmbed = {
    title: `${icon} ${alertTitle}アラート`,
    description: `**${serverName}** でパフォーマンス低下を検出しました`,
    color,
    fields: [
      {
        name: alertType === 'tps' ? '現在のTPS' : '現在のメモリ使用率',
        value: `${currentValue.toFixed(1)}${unit}`,
        inline: true,
      },
      {
        name: '閾値',
        value: `${threshold}${unit}`,
        inline: true,
      },
      {
        name: '重要度',
        value: severity === 'critical' ? '危険' : '警告',
        inline: true,
      },
    ],
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * バックアップ完了通知を送信
 */
export async function notifyBackupComplete(
  serverId: string,
  serverName: string,
  backupType: 'world' | 'full' | 'manual',
  backupSize: string,
  success: boolean
): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'backup_complete')) {
    return false;
  }

  const typeLabel = backupType === 'world' ? 'ワールド' : backupType === 'full' ? 'フル' : '手動';

  if (success) {
    const embed: DiscordEmbed = {
      title: '💾 バックアップ完了',
      description: `**${serverName}** のバックアップが完了しました`,
      color: DISCORD_COLORS.SUCCESS,
      fields: [
        {
          name: 'バックアップ種類',
          value: typeLabel,
          inline: true,
        },
        {
          name: 'サイズ',
          value: backupSize,
          inline: true,
        },
      ],
      footer: {
        text: `サーバーID: ${serverId}`,
      },
    };

    return sendDiscordNotification(discordConfig.webhookUrl, embed);
  } else {
    const embed: DiscordEmbed = {
      title: '❌ バックアップ失敗',
      description: `**${serverName}** のバックアップに失敗しました`,
      color: DISCORD_COLORS.ERROR,
      fields: [
        {
          name: 'バックアップ種類',
          value: typeLabel,
          inline: true,
        },
      ],
      footer: {
        text: `サーバーID: ${serverId}`,
      },
    };

    return sendDiscordNotification(discordConfig.webhookUrl, embed);
  }
}

/**
 * プラグイン更新検出通知を送信
 */
export async function notifyPluginUpdates(
  serverId: string,
  serverName: string,
  updates: Array<{ name: string; currentVersion: string; latestVersion: string }>
): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  if (!isNotificationEnabled(discordConfig, 'plugin_update')) {
    return false;
  }

  if (updates.length === 0) {
    return false;
  }

  const updateList = updates
    .slice(0, 10) // 最大10件
    .map((u) => `• **${u.name}**: ${u.currentVersion} → ${u.latestVersion}`)
    .join('\n');

  const embed: DiscordEmbed = {
    title: '📦 プラグイン更新検出',
    description: `**${serverName}** で ${updates.length} 件のプラグイン更新が見つかりました`,
    color: DISCORD_COLORS.INFO,
    fields: [
      {
        name: '更新可能なプラグイン',
        value: updateList,
        inline: false,
      },
    ],
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * 自動再起動通知を送信
 */
export async function notifyAutoRestart(
  serverId: string,
  serverName: string,
  reason: string
): Promise<boolean> {
  const config = await getAutomationConfig(serverId);
  const discordConfig = config.discord;

  // 自動再起動はhealth_alertとして扱う
  if (!isNotificationEnabled(discordConfig, 'health_alert')) {
    return false;
  }

  const embed: DiscordEmbed = {
    title: '🔄 自動再起動',
    description: `**${serverName}** を自動再起動しました`,
    color: DISCORD_COLORS.WARNING,
    fields: [
      {
        name: '理由',
        value: reason,
        inline: false,
      },
    ],
    footer: {
      text: `サーバーID: ${serverId}`,
    },
  };

  return sendDiscordNotification(discordConfig.webhookUrl, embed);
}

/**
 * テスト通知を送信
 */
export async function sendTestNotification(webhookUrl: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '✅ テスト通知',
    description: 'Discord Webhook通知のテストです。この通知が表示されていれば、設定は正常です。',
    color: DISCORD_COLORS.SUCCESS,
    footer: {
      text: 'Minecraft Server Manager',
    },
  };

  return sendDiscordNotification(webhookUrl, embed);
}

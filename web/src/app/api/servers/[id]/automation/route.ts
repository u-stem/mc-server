/**
 * オートメーション設定 API
 * GET: 設定を取得
 * PUT: 設定を更新
 */
import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getAutomationConfig, saveAutomationConfig } from '@/lib/automation';
import {
  INTERVAL_HEALTH_CHECK_MIN_SECONDS,
  MIN_BACKUP_RETENTION_COUNT,
  MIN_BACKUP_RETENTION_DAYS,
  MIN_CONSECUTIVE_FAILURES,
} from '@/lib/constants';
import { isValidDiscordWebhookUrl } from '@/lib/discord';
import {
  createMinValueError,
  ERROR_INVALID_DISCORD_WEBHOOK_FORMAT,
  ERROR_WEBHOOK_URL_REQUIRED_WHEN_ENABLED,
} from '@/lib/errorMessages';
import type { ApiResponse, AutomationConfig, ServerIdParams } from '@/types';

export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<AutomationConfig>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<AutomationConfig>>;
    }

    const config = await getAutomationConfig(id);

    return successResponse(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<AutomationConfig>>;
  }
}

export async function PUT(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<AutomationConfig>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<AutomationConfig>>;
    }

    const body: Partial<AutomationConfig> = await request.json();

    // 既存の設定とマージ
    const currentConfig = await getAutomationConfig(id);
    const newConfig: AutomationConfig = {
      discord: { ...currentConfig.discord, ...body.discord },
      backup: { ...currentConfig.backup, ...body.backup },
      pluginUpdate: { ...currentConfig.pluginUpdate, ...body.pluginUpdate },
      healthCheck: { ...currentConfig.healthCheck, ...body.healthCheck },
    };

    // バリデーション
    if (newConfig.discord.enabled) {
      if (!newConfig.discord.webhookUrl) {
        return errorResponse(ERROR_WEBHOOK_URL_REQUIRED_WHEN_ENABLED, 400) as NextResponse<
          ApiResponse<AutomationConfig>
        >;
      }
      if (!isValidDiscordWebhookUrl(newConfig.discord.webhookUrl)) {
        return errorResponse(ERROR_INVALID_DISCORD_WEBHOOK_FORMAT, 400) as NextResponse<
          ApiResponse<AutomationConfig>
        >;
      }
    }

    if (newConfig.backup.enabled) {
      if (newConfig.backup.retention.maxCount < MIN_BACKUP_RETENTION_COUNT) {
        return errorResponse(
          createMinValueError('バックアップ保持数', MIN_BACKUP_RETENTION_COUNT),
          400
        ) as NextResponse<ApiResponse<AutomationConfig>>;
      }
      if (newConfig.backup.retention.maxAgeDays < MIN_BACKUP_RETENTION_DAYS) {
        return errorResponse(
          createMinValueError('バックアップ保持日数', MIN_BACKUP_RETENTION_DAYS, '日'),
          400
        ) as NextResponse<ApiResponse<AutomationConfig>>;
      }
    }

    if (newConfig.healthCheck.enabled) {
      if (newConfig.healthCheck.checkIntervalSeconds < INTERVAL_HEALTH_CHECK_MIN_SECONDS) {
        return errorResponse(
          createMinValueError('ヘルスチェック間隔', INTERVAL_HEALTH_CHECK_MIN_SECONDS, '秒'),
          400
        ) as NextResponse<ApiResponse<AutomationConfig>>;
      }
      if (newConfig.healthCheck.consecutiveFailures < MIN_CONSECUTIVE_FAILURES) {
        return errorResponse(
          createMinValueError('連続失敗回数', MIN_CONSECUTIVE_FAILURES),
          400
        ) as NextResponse<ApiResponse<AutomationConfig>>;
      }
    }

    await saveAutomationConfig(id, newConfig);

    return successResponse(newConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<AutomationConfig>>;
  }
}

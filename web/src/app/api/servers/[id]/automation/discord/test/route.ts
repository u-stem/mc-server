/**
 * Discord Webhook テスト送信 API
 * POST: テスト通知を送信
 */
import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { sendTestNotification } from '@/lib/discord';
import {
  ERROR_INVALID_DISCORD_WEBHOOK_FORMAT,
  ERROR_SEND_TEST_NOTIFICATION_FAILED,
  ERROR_WEBHOOK_URL_REQUIRED,
} from '@/lib/errorMessages';
import type { ApiResponse, ServerIdParams } from '@/types';

const MSG_TEST_NOTIFICATION_SENT = 'テスト通知を送信しました';

export async function POST(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<{ message: string }>>;
    }

    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return errorResponse(ERROR_WEBHOOK_URL_REQUIRED, 400) as NextResponse<
        ApiResponse<{ message: string }>
      >;
    }

    // Discord Webhook URLの形式をチェック
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return errorResponse(ERROR_INVALID_DISCORD_WEBHOOK_FORMAT, 400) as NextResponse<
        ApiResponse<{ message: string }>
      >;
    }

    const success = await sendTestNotification(webhookUrl);

    if (!success) {
      return errorResponse(ERROR_SEND_TEST_NOTIFICATION_FAILED) as NextResponse<
        ApiResponse<{ message: string }>
      >;
    }

    return successResponse({ message: MSG_TEST_NOTIFICATION_SENT });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<{ message: string }>>;
  }
}

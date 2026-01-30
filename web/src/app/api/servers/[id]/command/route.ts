import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_COMMAND_REQUIRED,
  ERROR_RCON_CONNECTION_REFUSED,
  ERROR_RCON_CONNECTION_TIMEOUT,
  ERROR_SEND_COMMAND_FAILED,
} from '@/lib/errorMessages';
import { executeConsoleCommand } from '@/lib/rcon';
import type { ApiResponse, ServerIdParams } from '@/types';

// POST /api/servers/[id]/command - コマンド実行
export async function POST(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<{ response: string }>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<{ response: string }>>;
    }

    const body = await request.json();
    const { command } = body as { command: string };

    if (!command || typeof command !== 'string') {
      return errorResponse(ERROR_COMMAND_REQUIRED, 400) as NextResponse<
        ApiResponse<{ response: string }>
      >;
    }

    const response = await executeConsoleCommand(id, command);

    return successResponse({ response });
  } catch (error) {
    console.error(ERROR_SEND_COMMAND_FAILED, error);

    // RCON接続エラーの場合、わかりやすいメッセージに変換
    const errorCode = (error as NodeJS.ErrnoException)?.code;
    let errorMessage: string;

    if (errorCode === 'ECONNREFUSED') {
      errorMessage = ERROR_RCON_CONNECTION_REFUSED;
    } else if (errorCode === 'ETIMEDOUT') {
      errorMessage = ERROR_RCON_CONNECTION_TIMEOUT;
    } else {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return errorResponse(errorMessage) as NextResponse<ApiResponse<{ response: string }>>;
  }
}

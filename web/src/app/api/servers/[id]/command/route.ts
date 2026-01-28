import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { executeConsoleCommand } from '@/lib/rcon';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/command - コマンド実行
export async function POST(
  request: Request,
  { params }: RouteParams
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
      return errorResponse('Command is required', 400) as NextResponse<
        ApiResponse<{ response: string }>
      >;
    }

    const response = await executeConsoleCommand(id, command);

    return successResponse({ response });
  } catch (error) {
    console.error('Failed to execute command:', error);

    // RCON接続エラーの場合、わかりやすいメッセージに変換
    const errorCode = (error as NodeJS.ErrnoException)?.code;
    let errorMessage: string;

    if (errorCode === 'ECONNREFUSED') {
      errorMessage = 'サーバーに接続できません。サーバーが完全に起動するまでお待ちください。';
    } else if (errorCode === 'ETIMEDOUT') {
      errorMessage = '接続がタイムアウトしました。サーバーの状態を確認してください。';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return errorResponse(errorMessage) as NextResponse<ApiResponse<{ response: string }>>;
  }
}

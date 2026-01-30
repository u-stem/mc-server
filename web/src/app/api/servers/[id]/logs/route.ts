import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { DEFAULT_LOG_LINES } from '@/lib/constants';
import { getServerLogs } from '@/lib/docker';
import { ERROR_GET_LOGS_FAILED, withErrorContext } from '@/lib/errorMessages';
import type { ApiResponse, ServerIdParams } from '@/types';

// GET /api/servers/[id]/logs - ログ取得
export async function GET(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<{ logs: string }>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<{ logs: string }>>;
    }

    // クエリパラメータから行数を取得
    const url = new URL(request.url);
    const linesParam = url.searchParams.get('lines');
    const lines = linesParam ? parseInt(linesParam, 10) : DEFAULT_LOG_LINES;

    const logs = await getServerLogs(id, lines);

    return successResponse({ logs });
  } catch (error) {
    console.error(ERROR_GET_LOGS_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_GET_LOGS_FAILED, errorMessage)) as NextResponse<
      ApiResponse<{ logs: string }>
    >;
  }
}

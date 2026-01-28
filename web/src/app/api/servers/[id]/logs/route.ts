import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getServerLogs } from '@/lib/docker';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/logs - ログ取得
export async function GET(
  request: Request,
  { params }: RouteParams
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
    const lines = linesParam ? parseInt(linesParam, 10) : 100;

    const logs = await getServerLogs(id, lines);

    return successResponse({ logs });
  } catch (error) {
    console.error('Failed to get logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to get logs: ${errorMessage}`) as NextResponse<
      ApiResponse<{ logs: string }>
    >;
  }
}

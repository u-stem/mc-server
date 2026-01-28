import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { getServerLogs } from '@/lib/docker';
import { ServerIdSchema } from '@/lib/validation';
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

    // サーバーIDをバリデーション
    const idResult = ServerIdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid server ID format' },
        { status: 400 }
      );
    }

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    // クエリパラメータから行数を取得
    const url = new URL(request.url);
    const linesParam = url.searchParams.get('lines');
    const lines = linesParam ? parseInt(linesParam, 10) : 100;

    const logs = await getServerLogs(id, lines);

    return NextResponse.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Failed to get logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to get logs: ${errorMessage}` },
      { status: 500 }
    );
  }
}

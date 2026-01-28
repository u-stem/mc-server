import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { getContainerInfo, getServerStatus } from '@/lib/docker';
import { ServerIdSchema } from '@/lib/validation';
import type { ApiResponse, ServerStatus } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/status - ステータス取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerStatus>>> {
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

    const status = await getServerStatus(id);
    const containerInfo = await getContainerInfo(id);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        uptime: containerInfo?.uptime,
        memory: containerInfo?.memory,
      },
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get server status' },
      { status: 500 }
    );
  }
}

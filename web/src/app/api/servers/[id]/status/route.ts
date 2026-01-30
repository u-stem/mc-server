import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getContainerInfo, getServerStatus } from '@/lib/docker';
import { getTps } from '@/lib/rcon';
import type { ApiResponse, ServerStatus, TpsInfo } from '@/types';
import { supportsTps } from '@/types';

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

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerStatus>>;
    }

    const { server } = result;
    const status = await getServerStatus(id);
    const containerInfo = await getContainerInfo(id);

    // TPSを取得（サーバーが起動中かつTPSサポートタイプの場合のみ）
    let tps: TpsInfo | undefined;
    if (status.running && supportsTps(server.type)) {
      tps = (await getTps(id)) ?? undefined;
    }

    return successResponse({
      ...status,
      uptime: containerInfo?.uptime,
      memory: containerInfo?.memory,
      tps,
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return errorResponse('Failed to get server status') as NextResponse<ApiResponse<ServerStatus>>;
  }
}

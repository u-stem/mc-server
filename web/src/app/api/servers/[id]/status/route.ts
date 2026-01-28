import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getContainerInfo, getServerStatus } from '@/lib/docker';
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

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerStatus>>;
    }

    const status = await getServerStatus(id);
    const containerInfo = await getContainerInfo(id);

    return successResponse({
      ...status,
      uptime: containerInfo?.uptime,
      memory: containerInfo?.memory,
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return errorResponse('Failed to get server status') as NextResponse<ApiResponse<ServerStatus>>;
  }
}

import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { stopServer } from '@/lib/docker';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/stop - サーバー停止
export async function POST(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    await stopServer(id);

    return successResponse({ message: `Server ${result.server.name} has been stopped` });
  } catch (error) {
    console.error('Failed to stop server:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to stop server: ${errorMessage}`);
  }
}

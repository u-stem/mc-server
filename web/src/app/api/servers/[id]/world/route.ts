import type { NextRequest, NextResponse } from 'next/server';
import { successResponse, validateAndGetServer, withErrorHandler } from '@/lib/apiHelpers';
import { getServerWorldInfo } from '@/lib/world';
import type { ApiResponse } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/servers/[id]/world - ワールド情報を取得
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;

  return withErrorHandler(async () => {
    const validation = await validateAndGetServer(id);
    if (!validation.success) {
      return validation.response;
    }

    const info = await getServerWorldInfo(id);

    if (!info) {
      return successResponse({ exists: false });
    }

    return successResponse(info);
  }, 'Failed to get world info');
}

import type { NextRequest, NextResponse } from 'next/server';
import { successResponse, validateAndGetServer, withErrorHandler } from '@/lib/apiHelpers';
import { ERROR_GET_WORLD_INFO_FAILED } from '@/lib/errorMessages';
import { getServerWorldInfo } from '@/lib/world';
import type { ApiResponse, ServerIdParams } from '@/types';

// GET /api/servers/[id]/world - ワールド情報を取得
export async function GET(
  _request: NextRequest,
  { params }: ServerIdParams
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
  }, ERROR_GET_WORLD_INFO_FAILED);
}

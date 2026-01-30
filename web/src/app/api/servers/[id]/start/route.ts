import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { startServer } from '@/lib/docker';
import { ERROR_START_SERVER_FAILED, withErrorContext } from '@/lib/errorMessages';
import type { ApiResponse, ServerIdParams } from '@/types';

// POST /api/servers/[id]/start - サーバー起動
export async function POST(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    await startServer(id);

    return successResponse({ message: `Server ${result.server.name} is starting` });
  } catch (error) {
    console.error(ERROR_START_SERVER_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_START_SERVER_FAILED, errorMessage));
  }
}

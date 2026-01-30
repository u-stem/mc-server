import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { stopServer } from '@/lib/docker';
import { ERROR_STOP_SERVER_FAILED, withErrorContext } from '@/lib/errorMessages';
import type { ApiResponse, ServerIdParams } from '@/types';

// POST /api/servers/[id]/stop - サーバー停止
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

    await stopServer(id);

    return successResponse({ message: `Server ${result.server.name} has been stopped` });
  } catch (error) {
    console.error(ERROR_STOP_SERVER_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_STOP_SERVER_FAILED, errorMessage));
  }
}

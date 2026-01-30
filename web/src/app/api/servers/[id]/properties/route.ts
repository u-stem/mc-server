import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_GET_PROPERTIES_FAILED,
  ERROR_UPDATE_PROPERTIES_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import {
  getServerProperties,
  type ServerProperties,
  updateServerProperties,
} from '@/lib/serverProperties';
import type { ApiResponse, ServerIdParams } from '@/types';

// GET /api/servers/[id]/properties - サーバー設定取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<ServerProperties>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerProperties>>;
    }

    const properties = await getServerProperties(id);

    return successResponse(properties);
  } catch (error) {
    console.error(ERROR_GET_PROPERTIES_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_GET_PROPERTIES_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<ServerProperties>>;
  }
}

// PUT /api/servers/[id]/properties - サーバー設定更新
export async function PUT(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<ServerProperties>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerProperties>>;
    }

    const body = await request.json();
    const updates = body as Partial<ServerProperties>;

    // 危険な設定の変更を制限
    const restrictedKeys = ['server-port', 'rcon.port', 'rcon.password', 'enable-rcon'];
    for (const key of restrictedKeys) {
      if (key in updates) {
        delete updates[key as keyof typeof updates];
      }
    }

    const properties = await updateServerProperties(id, updates);

    return successResponse(properties);
  } catch (error) {
    console.error(ERROR_UPDATE_PROPERTIES_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_UPDATE_PROPERTIES_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<ServerProperties>>;
  }
}

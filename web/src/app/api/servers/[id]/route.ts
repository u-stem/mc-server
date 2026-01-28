import type { NextResponse } from 'next/server';
import {
  errorResponse,
  successResponse,
  validateAndGetServer,
  validateServerId,
} from '@/lib/apiHelpers';
import { deleteServer, updateServer } from '@/lib/config';
import { getServerStatus } from '@/lib/docker';
import { CreateServerSchema } from '@/lib/validation';
import type { ApiResponse, ServerConfig, ServerDetails } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id] - サーバー詳細取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerDetails>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerDetails>>;
    }

    const status = await getServerStatus(id);

    return successResponse({ ...result.server, status });
  } catch (error) {
    console.error('Failed to get server:', error);
    return errorResponse('Failed to get server') as NextResponse<ApiResponse<ServerDetails>>;
  }
}

// DELETE /api/servers/[id] - サーバー削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const validation = validateServerId(id);
    if (!validation.valid) {
      return validation.response;
    }

    const deleted = await deleteServer(id);

    if (!deleted) {
      return errorResponse('Server not found', 404);
    }

    return successResponse();
  } catch (error) {
    console.error('Failed to delete server:', error);
    return errorResponse('Failed to delete server');
  }
}

// PUT /api/servers/[id] - サーバー設定更新
export async function PUT(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerConfig>>> {
  try {
    const { id } = await params;

    const validation = validateServerId(id);
    if (!validation.valid) {
      return validation.response as NextResponse<ApiResponse<ServerConfig>>;
    }

    const body = await request.json();

    // 部分的な更新なので、必須フィールドをオプショナルにしたスキーマを使用
    const updateSchema = CreateServerSchema.partial();
    const parseResult = updateSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ');
      return errorResponse(`Validation error: ${errors}`, 400) as NextResponse<
        ApiResponse<ServerConfig>
      >;
    }

    const updated = await updateServer(id, parseResult.data);

    if (!updated) {
      return errorResponse('Server not found', 404) as NextResponse<ApiResponse<ServerConfig>>;
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Failed to update server:', error);
    const message = error instanceof Error ? error.message : 'Failed to update server';
    return errorResponse(message) as NextResponse<ApiResponse<ServerConfig>>;
  }
}

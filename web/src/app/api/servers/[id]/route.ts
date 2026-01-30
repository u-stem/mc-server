import type { NextResponse } from 'next/server';
import {
  errorResponse,
  successResponse,
  validateAndGetServer,
  validateServerId,
} from '@/lib/apiHelpers';
import { deleteServer, updateServer } from '@/lib/config';
import { getContainerInfo, getServerStatus } from '@/lib/docker';
import {
  createValidationError,
  ERROR_DELETE_SERVER_FAILED,
  ERROR_GET_SERVER_FAILED,
  ERROR_SERVER_NOT_FOUND,
  ERROR_UPDATE_SERVER_FAILED,
} from '@/lib/errorMessages';
import { getTps } from '@/lib/rcon';
import { CreateServerSchema } from '@/lib/validation';
import type { ApiResponse, ServerConfig, ServerDetails, ServerIdParams, TpsInfo } from '@/types';
import { supportsTps } from '@/types';

// GET /api/servers/[id] - サーバー詳細取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<ServerDetails>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerDetails>>;
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
      ...server,
      status: {
        ...status,
        uptime: containerInfo?.uptime,
        memory: containerInfo?.memory,
        tps,
      },
    });
  } catch (error) {
    console.error(ERROR_GET_SERVER_FAILED, error);
    return errorResponse(ERROR_GET_SERVER_FAILED) as NextResponse<ApiResponse<ServerDetails>>;
  }
}

// DELETE /api/servers/[id] - サーバー削除
export async function DELETE(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const validation = validateServerId(id);
    if (!validation.valid) {
      return validation.response;
    }

    const deleted = await deleteServer(id);

    if (!deleted) {
      return errorResponse(ERROR_SERVER_NOT_FOUND, 404);
    }

    return successResponse();
  } catch (error) {
    console.error(ERROR_DELETE_SERVER_FAILED, error);
    return errorResponse(ERROR_DELETE_SERVER_FAILED);
  }
}

// PUT /api/servers/[id] - サーバー設定更新
export async function PUT(
  request: Request,
  { params }: ServerIdParams
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
      return errorResponse(createValidationError(errors), 400) as NextResponse<
        ApiResponse<ServerConfig>
      >;
    }

    const updated = await updateServer(id, parseResult.data);

    if (!updated) {
      return errorResponse(ERROR_SERVER_NOT_FOUND, 404) as NextResponse<ApiResponse<ServerConfig>>;
    }

    return successResponse(updated);
  } catch (error) {
    console.error(ERROR_UPDATE_SERVER_FAILED, error);
    const message = error instanceof Error ? error.message : ERROR_UPDATE_SERVER_FAILED;
    return errorResponse(message) as NextResponse<ApiResponse<ServerConfig>>;
  }
}

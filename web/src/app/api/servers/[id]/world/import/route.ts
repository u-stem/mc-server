import type { NextRequest, NextResponse } from 'next/server';
import {
  errorResponse,
  successResponse,
  validateAndGetServer,
  withErrorHandler,
} from '@/lib/apiHelpers';
import { getServerStatus } from '@/lib/docker';
import {
  ERROR_FILE_NOT_SPECIFIED,
  ERROR_FILE_SIZE_EXCEEDS_LIMIT,
  ERROR_IMPORT_WORLD_FAILED,
  ERROR_SERVER_IS_RUNNING,
  ERROR_UNSUPPORTED_ARCHIVE_FORMAT,
  ERROR_WORLD_IMPORT_FAILED,
} from '@/lib/errorMessages';
import { importServerWorld, isValidWorldArchive, MAX_WORLD_UPLOAD_SIZE } from '@/lib/world';
import type { ApiResponse, ServerIdParams } from '@/types';

// POST /api/servers/[id]/world/import - ワールドをインポート
export async function POST(
  request: NextRequest,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params;

  return withErrorHandler(async () => {
    const validation = await validateAndGetServer(id);
    if (!validation.success) {
      return validation.response;
    }

    // サーバーが起動中かチェック
    const status = await getServerStatus(id);
    if (status.running) {
      return errorResponse(ERROR_SERVER_IS_RUNNING, 400);
    }

    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('file');
    const overwrite = formData.get('overwrite') === 'true';

    if (!file || !(file instanceof File)) {
      return errorResponse(ERROR_FILE_NOT_SPECIFIED, 400);
    }

    // ファイル名チェック
    if (!isValidWorldArchive(file.name)) {
      return errorResponse(ERROR_UNSUPPORTED_ARCHIVE_FORMAT, 400);
    }

    // ファイルサイズチェック
    if (file.size > MAX_WORLD_UPLOAD_SIZE) {
      return errorResponse(ERROR_FILE_SIZE_EXCEEDS_LIMIT, 400);
    }

    // バッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // インポート実行
    const result = await importServerWorld(id, buffer, file.name, overwrite);

    if (!result.success) {
      return errorResponse(result.error || ERROR_WORLD_IMPORT_FAILED, 400);
    }

    return successResponse({ message: result.message });
  }, ERROR_IMPORT_WORLD_FAILED);
}

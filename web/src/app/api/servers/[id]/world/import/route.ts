import type { NextRequest, NextResponse } from 'next/server';
import {
  errorResponse,
  successResponse,
  validateAndGetServer,
  withErrorHandler,
} from '@/lib/apiHelpers';
import { getServerStatus } from '@/lib/docker';
import { importServerWorld, isValidWorldArchive, MAX_WORLD_UPLOAD_SIZE } from '@/lib/world';
import type { ApiResponse } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/servers/[id]/world/import - ワールドをインポート
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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
      return errorResponse(
        'サーバーが起動中です。インポートするには先にサーバーを停止してください',
        400
      );
    }

    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('file');
    const overwrite = formData.get('overwrite') === 'true';

    if (!file || !(file instanceof File)) {
      return errorResponse('ファイルが指定されていません', 400);
    }

    // ファイル名チェック
    if (!isValidWorldArchive(file.name)) {
      return errorResponse(
        '対応していないファイル形式です。.zip または .tar.gz を使用してください',
        400
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_WORLD_UPLOAD_SIZE) {
      return errorResponse('ファイルサイズが上限（500MB）を超えています', 400);
    }

    // バッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // インポート実行
    const result = await importServerWorld(id, buffer, file.name, overwrite);

    if (!result.success) {
      return errorResponse(result.error || 'インポートに失敗しました', 400);
    }

    return successResponse({ message: result.message });
  }, 'Failed to import world');
}

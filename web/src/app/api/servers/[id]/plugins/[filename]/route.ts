import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { deletePlugin, togglePlugin } from '@/lib/plugins';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse, PluginInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; filename: string }>;
}

// DELETE /api/servers/[id]/plugins/[filename] - プラグイン削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id, filename } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<{ deleted: boolean }>>;
    }

    // ファイル名をバリデーション
    const decodedFilename = decodeURIComponent(filename);
    if (!isValidFileName(decodedFilename.replace('.disabled', ''))) {
      return errorResponse('Invalid filename format', 400) as NextResponse<
        ApiResponse<{ deleted: boolean }>
      >;
    }

    const deleted = await deletePlugin(id, decodedFilename);

    if (!deleted) {
      return errorResponse('Plugin not found', 404) as NextResponse<
        ApiResponse<{ deleted: boolean }>
      >;
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Failed to delete plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to delete plugin: ${errorMessage}`) as NextResponse<
      ApiResponse<{ deleted: boolean }>
    >;
  }
}

// PATCH /api/servers/[id]/plugins/[filename] - プラグイン有効/無効切り替え
export async function PATCH(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<PluginInfo>>> {
  try {
    const { id, filename } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<PluginInfo>>;
    }

    // ファイル名をバリデーション
    const decodedFilename = decodeURIComponent(filename);
    if (!isValidFileName(decodedFilename.replace('.disabled', ''))) {
      return errorResponse('Invalid filename format', 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    const pluginInfo = await togglePlugin(id, decodedFilename);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error('Failed to toggle plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to toggle plugin: ${errorMessage}`) as NextResponse<
      ApiResponse<PluginInfo>
    >;
  }
}

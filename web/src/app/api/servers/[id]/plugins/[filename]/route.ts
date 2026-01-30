import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_DELETE_PLUGIN_FAILED,
  ERROR_INVALID_FILENAME_FORMAT,
  ERROR_PLUGIN_NOT_FOUND,
  ERROR_TOGGLE_PLUGIN_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import { deletePlugin, togglePlugin } from '@/lib/plugins';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse, FilenameParams, PluginInfo } from '@/types';

// DELETE /api/servers/[id]/plugins/[filename] - プラグイン削除
export async function DELETE(
  _request: Request,
  { params }: FilenameParams
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
      return errorResponse(ERROR_INVALID_FILENAME_FORMAT, 400) as NextResponse<
        ApiResponse<{ deleted: boolean }>
      >;
    }

    const deleted = await deletePlugin(id, decodedFilename);

    if (!deleted) {
      return errorResponse(ERROR_PLUGIN_NOT_FOUND, 404) as NextResponse<
        ApiResponse<{ deleted: boolean }>
      >;
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error(ERROR_DELETE_PLUGIN_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_DELETE_PLUGIN_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<{ deleted: boolean }>>;
  }
}

// PATCH /api/servers/[id]/plugins/[filename] - プラグイン有効/無効切り替え
export async function PATCH(
  _request: Request,
  { params }: FilenameParams
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
      return errorResponse(ERROR_INVALID_FILENAME_FORMAT, 400) as NextResponse<
        ApiResponse<PluginInfo>
      >;
    }

    const pluginInfo = await togglePlugin(id, decodedFilename);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error(ERROR_TOGGLE_PLUGIN_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_TOGGLE_PLUGIN_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<PluginInfo>>;
  }
}

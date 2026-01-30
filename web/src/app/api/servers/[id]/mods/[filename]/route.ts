import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_DELETE_MOD_FAILED,
  ERROR_INVALID_FILENAME_FORMAT,
  ERROR_MOD_NOT_FOUND,
  ERROR_TOGGLE_MOD_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import { deleteMod, toggleMod } from '@/lib/mods';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse, FilenameParams, ModInfo } from '@/types';

// DELETE /api/servers/[id]/mods/[filename] - Mod削除
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

    const deleted = await deleteMod(id, decodedFilename);

    if (!deleted) {
      return errorResponse(ERROR_MOD_NOT_FOUND, 404) as NextResponse<
        ApiResponse<{ deleted: boolean }>
      >;
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error(ERROR_DELETE_MOD_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_DELETE_MOD_FAILED, errorMessage)) as NextResponse<
      ApiResponse<{ deleted: boolean }>
    >;
  }
}

// PATCH /api/servers/[id]/mods/[filename] - Mod有効/無効切り替え
export async function PATCH(
  _request: Request,
  { params }: FilenameParams
): Promise<NextResponse<ApiResponse<ModInfo>>> {
  try {
    const { id, filename } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ModInfo>>;
    }

    // ファイル名をバリデーション
    const decodedFilename = decodeURIComponent(filename);
    if (!isValidFileName(decodedFilename.replace('.disabled', ''))) {
      return errorResponse(ERROR_INVALID_FILENAME_FORMAT, 400) as NextResponse<
        ApiResponse<ModInfo>
      >;
    }

    const modInfo = await toggleMod(id, decodedFilename);

    return successResponse(modInfo);
  } catch (error) {
    console.error(ERROR_TOGGLE_MOD_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_TOGGLE_MOD_FAILED, errorMessage)) as NextResponse<
      ApiResponse<ModInfo>
    >;
  }
}

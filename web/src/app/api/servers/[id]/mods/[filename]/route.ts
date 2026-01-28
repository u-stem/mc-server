import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { deleteMod, toggleMod } from '@/lib/mods';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse, ModInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; filename: string }>;
}

// DELETE /api/servers/[id]/mods/[filename] - Mod削除
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

    const deleted = await deleteMod(id, decodedFilename);

    if (!deleted) {
      return errorResponse('Mod not found', 404) as NextResponse<ApiResponse<{ deleted: boolean }>>;
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Failed to delete mod:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to delete mod: ${errorMessage}`) as NextResponse<
      ApiResponse<{ deleted: boolean }>
    >;
  }
}

// PATCH /api/servers/[id]/mods/[filename] - Mod有効/無効切り替え
export async function PATCH(
  _request: Request,
  { params }: RouteParams
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
      return errorResponse('Invalid filename format', 400) as NextResponse<ApiResponse<ModInfo>>;
    }

    const modInfo = await toggleMod(id, decodedFilename);

    return successResponse(modInfo);
  } catch (error) {
    console.error('Failed to toggle mod:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to toggle mod: ${errorMessage}`) as NextResponse<
      ApiResponse<ModInfo>
    >;
  }
}

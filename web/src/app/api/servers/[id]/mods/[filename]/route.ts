import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { deleteMod, toggleMod } from '@/lib/mods';
import { isValidFileName, ServerIdSchema } from '@/lib/validation';
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

    // サーバーIDをバリデーション
    const idResult = ServerIdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid server ID format' },
        { status: 400 }
      );
    }

    // ファイル名をバリデーション
    const decodedFilename = decodeURIComponent(filename);
    if (!isValidFileName(decodedFilename.replace('.disabled', ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const deleted = await deleteMod(id, decodedFilename);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Mod not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Failed to delete mod:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to delete mod: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PATCH /api/servers/[id]/mods/[filename] - Mod有効/無効切り替え
export async function PATCH(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ModInfo>>> {
  try {
    const { id, filename } = await params;

    // サーバーIDをバリデーション
    const idResult = ServerIdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid server ID format' },
        { status: 400 }
      );
    }

    // ファイル名をバリデーション
    const decodedFilename = decodeURIComponent(filename);
    if (!isValidFileName(decodedFilename.replace('.disabled', ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const modInfo = await toggleMod(id, decodedFilename);

    return NextResponse.json({
      success: true,
      data: modInfo,
    });
  } catch (error) {
    console.error('Failed to toggle mod:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to toggle mod: ${errorMessage}` },
      { status: 500 }
    );
  }
}

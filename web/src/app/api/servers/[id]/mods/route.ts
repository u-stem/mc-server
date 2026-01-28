import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { listMods, uploadMod } from '@/lib/mods';
import type { ApiResponse, ModInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/mods - Mod一覧取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ModInfo[]>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ModInfo[]>>;
    }

    const mods = await listMods(id);

    return successResponse(mods);
  } catch (error) {
    console.error('Failed to list mods:', error);
    return errorResponse('Failed to list mods') as NextResponse<ApiResponse<ModInfo[]>>;
  }
}

// POST /api/servers/[id]/mods - Modアップロード
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ModInfo>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ModInfo>>;
    }

    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400) as NextResponse<ApiResponse<ModInfo>>;
    }

    // ファイル名の取得
    const filename = file.name;

    // .jar 拡張子のチェック
    if (!filename.toLowerCase().endsWith('.jar')) {
      return errorResponse('Only .jar files are allowed', 400) as NextResponse<
        ApiResponse<ModInfo>
      >;
    }

    // ファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const modInfo = await uploadMod(id, filename, buffer);

    return successResponse(modInfo);
  } catch (error) {
    console.error('Failed to upload mod:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to upload mod: ${errorMessage}`) as NextResponse<
      ApiResponse<ModInfo>
    >;
  }
}

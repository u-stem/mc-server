import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { listPlugins, uploadPlugin } from '@/lib/plugins';
import type { ApiResponse, PluginInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/plugins - プラグイン一覧取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<PluginInfo[]>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<PluginInfo[]>>;
    }

    const plugins = await listPlugins(id);

    return successResponse(plugins);
  } catch (error) {
    console.error('Failed to list plugins:', error);
    return errorResponse('Failed to list plugins') as NextResponse<ApiResponse<PluginInfo[]>>;
  }
}

// POST /api/servers/[id]/plugins - プラグインアップロード
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<PluginInfo>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<PluginInfo>>;
    }

    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // ファイル名の取得
    const filename = file.name;

    // .jar 拡張子のチェック
    if (!filename.toLowerCase().endsWith('.jar')) {
      return errorResponse('Only .jar files are allowed', 400) as NextResponse<
        ApiResponse<PluginInfo>
      >;
    }

    // ファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pluginInfo = await uploadPlugin(id, filename, buffer);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error('Failed to upload plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to upload plugin: ${errorMessage}`) as NextResponse<
      ApiResponse<PluginInfo>
    >;
  }
}

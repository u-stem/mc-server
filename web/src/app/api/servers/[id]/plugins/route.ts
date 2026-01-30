import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_FILE_NOT_PROVIDED,
  ERROR_JAR_FILE_ONLY,
  ERROR_LIST_PLUGINS_FAILED,
  ERROR_UPLOAD_PLUGIN_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import { listPlugins, uploadPlugin } from '@/lib/plugins';
import type { ApiResponse, PluginInfo, ServerIdParams } from '@/types';

// GET /api/servers/[id]/plugins - プラグイン一覧取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
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
    console.error(ERROR_LIST_PLUGINS_FAILED, error);
    return errorResponse(ERROR_LIST_PLUGINS_FAILED) as NextResponse<ApiResponse<PluginInfo[]>>;
  }
}

// POST /api/servers/[id]/plugins - プラグインアップロード
export async function POST(
  request: Request,
  { params }: ServerIdParams
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
      return errorResponse(ERROR_FILE_NOT_PROVIDED, 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // ファイル名の取得
    const filename = file.name;

    // .jar 拡張子のチェック
    if (!filename.toLowerCase().endsWith('.jar')) {
      return errorResponse(ERROR_JAR_FILE_ONLY, 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // ファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pluginInfo = await uploadPlugin(id, filename, buffer);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error(ERROR_UPLOAD_PLUGIN_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_UPLOAD_PLUGIN_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<PluginInfo>>;
  }
}

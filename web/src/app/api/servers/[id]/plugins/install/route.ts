import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_DOWNLOAD_MODRINTH_FAILED,
  ERROR_INSTALL_PLUGIN_FAILED,
  ERROR_PLUGIN_ID_REQUIRED,
  ERROR_PLUGIN_NOT_IN_RECOMMENDED,
  withErrorContext,
} from '@/lib/errorMessages';
import { downloadPluginFromModrinth, RECOMMENDED_PLUGINS } from '@/lib/pluginCatalog';
import { uploadPlugin } from '@/lib/plugins';
import type { ApiResponse, PluginInfo, ServerIdParams } from '@/types';

// POST /api/servers/[id]/plugins/install - おすすめプラグインをインストール
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

    // リクエストボディからプラグインIDを取得
    const body = await request.json();
    const { pluginId } = body as { pluginId: string };

    if (!pluginId) {
      return errorResponse(ERROR_PLUGIN_ID_REQUIRED, 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // おすすめプラグインリストから検索
    const recommendedPlugin = RECOMMENDED_PLUGINS.find((p) => p.id === pluginId);
    if (!recommendedPlugin) {
      return errorResponse(ERROR_PLUGIN_NOT_IN_RECOMMENDED, 404) as NextResponse<
        ApiResponse<PluginInfo>
      >;
    }

    // Modrinthからダウンロード
    const downloadResult = await downloadPluginFromModrinth(
      recommendedPlugin.modrinthId,
      result.server.version
    );

    if (!downloadResult) {
      return errorResponse(ERROR_DOWNLOAD_MODRINTH_FAILED) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // プラグインをインストール
    const pluginInfo = await uploadPlugin(id, downloadResult.filename, downloadResult.buffer);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error(ERROR_INSTALL_PLUGIN_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_INSTALL_PLUGIN_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<PluginInfo>>;
  }
}

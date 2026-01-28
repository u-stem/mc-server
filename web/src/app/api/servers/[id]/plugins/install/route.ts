import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { downloadPluginFromModrinth, RECOMMENDED_PLUGINS } from '@/lib/pluginCatalog';
import { uploadPlugin } from '@/lib/plugins';
import type { ApiResponse, PluginInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/plugins/install - おすすめプラグインをインストール
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

    // リクエストボディからプラグインIDを取得
    const body = await request.json();
    const { pluginId } = body as { pluginId: string };

    if (!pluginId) {
      return errorResponse('Plugin ID is required', 400) as NextResponse<ApiResponse<PluginInfo>>;
    }

    // おすすめプラグインリストから検索
    const recommendedPlugin = RECOMMENDED_PLUGINS.find((p) => p.id === pluginId);
    if (!recommendedPlugin) {
      return errorResponse('Plugin not found in recommended list', 404) as NextResponse<
        ApiResponse<PluginInfo>
      >;
    }

    // Modrinthからダウンロード
    const downloadResult = await downloadPluginFromModrinth(
      recommendedPlugin.modrinthId,
      result.server.version
    );

    if (!downloadResult) {
      return errorResponse('Failed to download plugin from Modrinth') as NextResponse<
        ApiResponse<PluginInfo>
      >;
    }

    // プラグインをインストール
    const pluginInfo = await uploadPlugin(id, downloadResult.filename, downloadResult.buffer);

    return successResponse(pluginInfo);
  } catch (error) {
    console.error('Failed to install plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to install plugin: ${errorMessage}`) as NextResponse<
      ApiResponse<PluginInfo>
    >;
  }
}

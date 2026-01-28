import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { downloadPluginFromModrinth, RECOMMENDED_PLUGINS } from '@/lib/pluginCatalog';
import { uploadPlugin } from '@/lib/plugins';
import { ServerIdSchema } from '@/lib/validation';
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

    // サーバーIDをバリデーション
    const idResult = ServerIdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid server ID format' },
        { status: 400 }
      );
    }

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    // リクエストボディからプラグインIDを取得
    const body = await request.json();
    const { pluginId } = body as { pluginId: string };

    if (!pluginId) {
      return NextResponse.json({ success: false, error: 'Plugin ID is required' }, { status: 400 });
    }

    // おすすめプラグインリストから検索
    const recommendedPlugin = RECOMMENDED_PLUGINS.find((p) => p.id === pluginId);
    if (!recommendedPlugin) {
      return NextResponse.json(
        { success: false, error: 'Plugin not found in recommended list' },
        { status: 404 }
      );
    }

    // Modrinthからダウンロード
    const downloadResult = await downloadPluginFromModrinth(
      recommendedPlugin.modrinthId,
      server.version
    );

    if (!downloadResult) {
      return NextResponse.json(
        { success: false, error: 'Failed to download plugin from Modrinth' },
        { status: 500 }
      );
    }

    // プラグインをインストール
    const pluginInfo = await uploadPlugin(id, downloadResult.filename, downloadResult.buffer);

    return NextResponse.json({
      success: true,
      data: pluginInfo,
    });
  } catch (error) {
    console.error('Failed to install plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to install plugin: ${errorMessage}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { listPlugins, uploadPlugin } from '@/lib/plugins';
import { ServerIdSchema } from '@/lib/validation';
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

    const plugins = await listPlugins(id);

    return NextResponse.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    console.error('Failed to list plugins:', error);
    return NextResponse.json({ success: false, error: 'Failed to list plugins' }, { status: 500 });
  }
}

// POST /api/servers/[id]/plugins - プラグインアップロード
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

    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // ファイル名の取得
    const filename = file.name;

    // .jar 拡張子のチェック
    if (!filename.toLowerCase().endsWith('.jar')) {
      return NextResponse.json(
        { success: false, error: 'Only .jar files are allowed' },
        { status: 400 }
      );
    }

    // ファイルをバッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pluginInfo = await uploadPlugin(id, filename, buffer);

    return NextResponse.json({
      success: true,
      data: pluginInfo,
    });
  } catch (error) {
    console.error('Failed to upload plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to upload plugin: ${errorMessage}` },
      { status: 500 }
    );
  }
}

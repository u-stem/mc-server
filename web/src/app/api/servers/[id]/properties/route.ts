import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import {
  getServerProperties,
  type ServerProperties,
  updateServerProperties,
} from '@/lib/serverProperties';
import { ServerIdSchema } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/properties - サーバー設定取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerProperties>>> {
  try {
    const { id } = await params;

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

    const properties = await getServerProperties(id);

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Failed to get server properties:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to get properties: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT /api/servers/[id]/properties - サーバー設定更新
export async function PUT(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerProperties>>> {
  try {
    const { id } = await params;

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

    const body = await request.json();
    const updates = body as Partial<ServerProperties>;

    // 危険な設定の変更を制限
    const restrictedKeys = ['server-port', 'rcon.port', 'rcon.password', 'enable-rcon'];
    for (const key of restrictedKeys) {
      if (key in updates) {
        delete updates[key as keyof typeof updates];
      }
    }

    const properties = await updateServerProperties(id, updates);

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Failed to update server properties:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to update properties: ${errorMessage}` },
      { status: 500 }
    );
  }
}

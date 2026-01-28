import { NextResponse } from 'next/server';
import { deleteServer, getServer, updateServer } from '@/lib/config';
import { getServerStatus } from '@/lib/docker';
import { CreateServerSchema, ServerIdSchema } from '@/lib/validation';
import type { ApiResponse, ServerConfig, ServerDetails } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id] - サーバー詳細取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerDetails>>> {
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

    const status = await getServerStatus(id);

    return NextResponse.json({
      success: true,
      data: { ...server, status },
    });
  } catch (error) {
    console.error('Failed to get server:', error);
    return NextResponse.json({ success: false, error: 'Failed to get server' }, { status: 500 });
  }
}

// DELETE /api/servers/[id] - サーバー削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
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

    const deleted = await deleteServer(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete server:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete server' }, { status: 500 });
  }
}

// PUT /api/servers/[id] - サーバー設定更新
export async function PUT(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerConfig>>> {
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

    const body = await request.json();

    // 部分的な更新なので、必須フィールドをオプショナルにしたスキーマを使用
    const updateSchema = CreateServerSchema.partial();
    const parseResult = updateSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: `Validation error: ${errors}` },
        { status: 400 }
      );
    }

    const updated = await updateServer(id, parseResult.data);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Failed to update server:', error);
    const message = error instanceof Error ? error.message : 'Failed to update server';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

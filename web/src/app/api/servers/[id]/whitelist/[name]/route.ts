import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { removeFromWhitelist } from '@/lib/rcon';
import { PlayerNameSchema, ServerIdSchema } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; name: string }>;
}

// DELETE /api/servers/[id]/whitelist/[name] - プレイヤー削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id, name } = await params;

    // サーバーIDをバリデーション
    const idResult = ServerIdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid server ID format' },
        { status: 400 }
      );
    }

    // プレイヤー名をバリデーション
    const nameResult = PlayerNameSchema.safeParse(name);
    if (!nameResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid player name format' },
        { status: 400 }
      );
    }

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const result = await removeFromWhitelist(id, name);

    return NextResponse.json({
      success: true,
      data: { message: result },
    });
  } catch (error) {
    console.error('Failed to remove from whitelist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove player from whitelist' },
      { status: 500 }
    );
  }
}

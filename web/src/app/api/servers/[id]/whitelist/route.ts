import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { addToWhitelist, getWhitelist } from '@/lib/rcon';
import { AddPlayerSchema, ServerIdSchema } from '@/lib/validation';
import type { ApiResponse, WhitelistEntry } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/whitelist - ホワイトリスト取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<WhitelistEntry[]>>> {
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

    const whitelist = await getWhitelist(id);

    return NextResponse.json({
      success: true,
      data: whitelist,
    });
  } catch (error) {
    console.error('Failed to get whitelist:', error);
    return NextResponse.json({ success: false, error: 'Failed to get whitelist' }, { status: 500 });
  }
}

// POST /api/servers/[id]/whitelist - プレイヤー追加
export async function POST(
  request: Request,
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

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const body = await request.json();

    // Zodによるプレイヤー名バリデーション
    const parseResult = AddPlayerSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const result = await addToWhitelist(id, parseResult.data.name);

    return NextResponse.json({
      success: true,
      data: { message: result },
    });
  } catch (error) {
    console.error('Failed to add to whitelist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add player to whitelist' },
      { status: 500 }
    );
  }
}

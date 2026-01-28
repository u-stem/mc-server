import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { executeConsoleCommand } from '@/lib/rcon';
import { ServerIdSchema } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/command - コマンド実行
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ response: string }>>> {
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
    const { command } = body as { command: string };

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ success: false, error: 'Command is required' }, { status: 400 });
    }

    const response = await executeConsoleCommand(id, command);

    return NextResponse.json({
      success: true,
      data: { response },
    });
  } catch (error) {
    console.error('Failed to execute command:', error);

    // RCON接続エラーの場合、わかりやすいメッセージに変換
    const errorCode = (error as NodeJS.ErrnoException)?.code;
    let errorMessage: string;

    if (errorCode === 'ECONNREFUSED') {
      errorMessage = 'サーバーに接続できません。サーバーが完全に起動するまでお待ちください。';
    } else if (errorCode === 'ETIMEDOUT') {
      errorMessage = '接続がタイムアウトしました。サーバーの状態を確認してください。';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

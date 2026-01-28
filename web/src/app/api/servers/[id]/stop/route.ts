import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { stopServer } from '@/lib/docker';
import { ServerIdSchema } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/servers/[id]/stop - サーバー停止
export async function POST(
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

    const server = await getServer(id);

    if (!server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    await stopServer(id);

    return NextResponse.json({
      success: true,
      data: { message: `Server ${server.name} has been stopped` },
    });
  } catch (error) {
    console.error('Failed to stop server:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to stop server: ${errorMessage}` },
      { status: 500 }
    );
  }
}

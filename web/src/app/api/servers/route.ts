import { NextResponse } from 'next/server';
import { createServer, getAllServers } from '@/lib/config';
import { getServerStatus } from '@/lib/docker';
import { CreateServerSchema, generateRandomPassword } from '@/lib/validation';
import type { ApiResponse, ServerDetails } from '@/types';
import { isBedrockServer } from '@/types';

// GET /api/servers - サーバー一覧取得
export async function GET(): Promise<NextResponse<ApiResponse<ServerDetails[]>>> {
  try {
    const servers = await getAllServers();

    // 各サーバーのステータスを取得
    const serversWithStatus = await Promise.all(
      servers.map(async (server) => {
        const status = await getServerStatus(server.id);
        return { ...server, status };
      })
    );

    return NextResponse.json({
      success: true,
      data: serversWithStatus,
    });
  } catch (error) {
    console.error('Failed to get servers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get servers',
      },
      { status: 500 }
    );
  }
}

// POST /api/servers - サーバー作成
export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();

    // Zodによるバリデーション
    const parseResult = CreateServerSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${errors}`,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Bedrock サーバーの場合は RCON 設定不要
    const isBedrock = isBedrockServer(data.type);

    const server = await createServer({
      name: data.name,
      port: data.port,
      // Bedrock サーバーは RCON がないため 0 を設定
      rconPort: isBedrock ? 0 : (data.rconPort ?? 25575),
      // パスワードが未指定の場合はランダム生成（安全）、Bedrock の場合は空
      rconPassword: isBedrock ? '' : data.rconPassword || generateRandomPassword(),
      version: data.version,
      type: data.type,
      memory: data.memory,
      maxPlayers: data.maxPlayers,
      // プリセット設定
      presetId: data.presetId,
      advancedSettings: data.advancedSettings,
      // エディション
      edition: data.edition,
      // GeyserMC ポート
      geyserPort: data.geyserPort,
    });

    return NextResponse.json({
      success: true,
      data: server,
    });
  } catch (error) {
    console.error('Failed to create server:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create server',
      },
      { status: 500 }
    );
  }
}

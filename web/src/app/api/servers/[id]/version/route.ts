import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { createFullBackup } from '@/lib/backup';
import { updateServer } from '@/lib/config';
import { getServerStatus, recreateServer, stopServer } from '@/lib/docker';
import type { ApiResponse, VersionUpdateResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VersionUpdateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, {
    message: 'バージョンは "1.21.1" の形式で指定してください',
  }),
  createBackup: z.boolean().optional().default(true),
});

// PUT /api/servers/[id]/version - バージョン更新（バックアップ付き）
export async function PUT(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<VersionUpdateResponse>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<VersionUpdateResponse>>;
    }

    // リクエストボディをパース
    const body = await request.json();
    const parseResult = VersionUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.issues[0].message, 400) as NextResponse<
        ApiResponse<VersionUpdateResponse>
      >;
    }

    const { version: newVersion, createBackup: shouldCreateBackup } = parseResult.data;
    const previousVersion = result.server.version;

    // 同じバージョンへの更新は無視
    if (newVersion === previousVersion) {
      return successResponse({
        previousVersion,
        newVersion,
      });
    }

    // 1. サーバーが起動中なら停止
    const status = await getServerStatus(id);
    if (status.running) {
      await stopServer(id);
      // 停止を待つ
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 2. バックアップを作成（オプション）
    let backupPath: string | undefined;
    if (shouldCreateBackup) {
      try {
        const backup = await createFullBackup(id);
        backupPath = backup.filename;
      } catch (backupError) {
        // バックアップ失敗は警告のみ（ワールドがない場合など）
        console.warn('Backup creation failed:', backupError);
      }
    }

    // 3. config.json の version を更新 → docker-compose.yml 再生成
    await updateServer(id, { version: newVersion });

    // 4. コンテナを再作成
    await recreateServer(id);

    // 5. 起動確認（最大30秒待機）
    let startupConfirmed = false;
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const newStatus = await getServerStatus(id);
      if (newStatus.running) {
        startupConfirmed = true;
        break;
      }
    }

    if (!startupConfirmed) {
      // 起動失敗の場合も結果は返す
      console.warn('Server may not have started properly after version update');
    }

    return successResponse({
      previousVersion,
      newVersion,
      backupPath,
    });
  } catch (error) {
    console.error('Failed to update version:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to update version: ${errorMessage}`) as NextResponse<
      ApiResponse<VersionUpdateResponse>
    >;
  }
}

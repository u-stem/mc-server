import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { createFullBackup } from '@/lib/backup';
import { updateServer } from '@/lib/config';
import { STARTUP_MAX_RETRY_COUNT, STARTUP_RETRY_DELAY_MS } from '@/lib/constants';
import { getServerStatus, recreateServer, stopServer } from '@/lib/docker';
import {
  ERROR_INVALID_VERSION_FORMAT,
  ERROR_UPDATE_VERSION_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import type { ApiResponse, ServerIdParams, VersionUpdateResponse } from '@/types';

const VersionUpdateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, {
    message: ERROR_INVALID_VERSION_FORMAT,
  }),
  createBackup: z.boolean().optional().default(true),
});

// PUT /api/servers/[id]/version - バージョン更新（バックアップ付き）
export async function PUT(
  request: Request,
  { params }: ServerIdParams
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
      await new Promise((resolve) => setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
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
    for (let i = 0; i < STARTUP_MAX_RETRY_COUNT; i++) {
      await new Promise((resolve) => setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
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
    console.error(ERROR_UPDATE_VERSION_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_UPDATE_VERSION_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<VersionUpdateResponse>>;
  }
}

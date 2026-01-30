/**
 * 手動バックアップ実行 API
 * POST: バックアップを即時実行
 */
import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getBackupState, saveBackupState } from '@/lib/automation';
import { createBackup, createFullBackup } from '@/lib/backup';
import { notifyBackupComplete } from '@/lib/discord';
import { formatSize } from '@/lib/utils';
import type { ApiResponse, BackupInfo, BackupState, ServerIdParams } from '@/types';

export async function POST(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<BackupInfo>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<BackupInfo>>;
    }

    const body = await request.json().catch(() => ({}));
    const backupType = body.type === 'full' ? 'full' : 'world';

    let backup: BackupInfo;
    let success = false;

    try {
      if (backupType === 'full') {
        backup = await createFullBackup(id);
      } else {
        backup = await createBackup(id);
      }
      success = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'バックアップに失敗しました';
      return errorResponse(message) as NextResponse<ApiResponse<BackupInfo>>;
    }

    // 状態を更新
    const state: BackupState = await getBackupState(id);
    state.lastBackupTime = new Date().toISOString();
    state.lastBackupType = 'manual';
    state.lastBackupSuccess = success;
    await saveBackupState(id, state);

    // Discord通知
    await notifyBackupComplete(id, result.server.name, 'manual', formatSize(backup.size), success);

    return successResponse(backup);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<BackupInfo>>;
  }
}

import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { createBackup, listBackups } from '@/lib/backup';
import {
  ERROR_CREATE_BACKUP_FAILED,
  ERROR_LIST_BACKUPS_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import type { ApiResponse, BackupInfo, ServerIdParams } from '@/types';

// GET /api/servers/[id]/backups - バックアップ一覧取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<BackupInfo[]>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<BackupInfo[]>>;
    }

    const backups = await listBackups(id);

    return successResponse(backups);
  } catch (error) {
    console.error(ERROR_LIST_BACKUPS_FAILED, error);
    return errorResponse(ERROR_LIST_BACKUPS_FAILED) as NextResponse<ApiResponse<BackupInfo[]>>;
  }
}

// POST /api/servers/[id]/backups - バックアップ作成
export async function POST(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<BackupInfo>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<BackupInfo>>;
    }

    const backup = await createBackup(id);

    return successResponse(backup);
  } catch (error) {
    console.error(ERROR_CREATE_BACKUP_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_CREATE_BACKUP_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<BackupInfo>>;
  }
}

import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { deleteBackup } from '@/lib/backup';
import {
  ERROR_BACKUP_NOT_FOUND,
  ERROR_DELETE_BACKUP_FAILED,
  ERROR_INVALID_BACKUP_ID_FORMAT,
  MSG_BACKUP_DELETED,
} from '@/lib/errorMessages';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse, BackupIdParams } from '@/types';

// DELETE /api/servers/[id]/backups/[backupId] - バックアップ削除
export async function DELETE(
  _request: Request,
  { params }: BackupIdParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id, backupId } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    // バックアップIDをバリデーション
    if (!isValidFileName(backupId)) {
      return errorResponse(ERROR_INVALID_BACKUP_ID_FORMAT, 400);
    }

    const deleted = await deleteBackup(id, backupId);

    if (!deleted) {
      return errorResponse(ERROR_BACKUP_NOT_FOUND, 404);
    }

    return successResponse({ message: MSG_BACKUP_DELETED });
  } catch (error) {
    console.error(ERROR_DELETE_BACKUP_FAILED, error);
    return errorResponse(ERROR_DELETE_BACKUP_FAILED);
  }
}

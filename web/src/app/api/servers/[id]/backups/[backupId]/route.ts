import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { deleteBackup } from '@/lib/backup';
import { isValidFileName } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; backupId: string }>;
}

// DELETE /api/servers/[id]/backups/[backupId] - バックアップ削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id, backupId } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    // バックアップIDをバリデーション
    if (!isValidFileName(backupId)) {
      return errorResponse('Invalid backup ID format', 400);
    }

    const deleted = await deleteBackup(id, backupId);

    if (!deleted) {
      return errorResponse('Backup not found', 404);
    }

    return successResponse({ message: 'Backup deleted' });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return errorResponse('Failed to delete backup');
  }
}

import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { createBackup, listBackups } from '@/lib/backup';
import type { ApiResponse, BackupInfo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/backups - バックアップ一覧取得
export async function GET(
  _request: Request,
  { params }: RouteParams
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
    console.error('Failed to list backups:', error);
    return errorResponse('Failed to list backups') as NextResponse<ApiResponse<BackupInfo[]>>;
  }
}

// POST /api/servers/[id]/backups - バックアップ作成
export async function POST(
  _request: Request,
  { params }: RouteParams
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
    console.error('Failed to create backup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to create backup: ${errorMessage}`) as NextResponse<
      ApiResponse<BackupInfo>
    >;
  }
}

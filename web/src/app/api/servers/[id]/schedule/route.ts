import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getSchedule, saveSchedule } from '@/lib/scheduler';
import type { ApiResponse, ServerSchedule } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/schedule - スケジュール設定取得
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerSchedule>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerSchedule>>;
    }

    const schedule = await getSchedule(id);

    return successResponse(schedule);
  } catch (error) {
    console.error('Failed to get schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to get schedule: ${errorMessage}`) as NextResponse<
      ApiResponse<ServerSchedule>
    >;
  }
}

// PUT /api/servers/[id]/schedule - スケジュール設定更新
export async function PUT(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<ServerSchedule>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<ServerSchedule>>;
    }

    const body = (await request.json()) as ServerSchedule;

    // バリデーション
    if (typeof body.enabled !== 'boolean') {
      return errorResponse('Invalid schedule: enabled must be boolean', 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    if (!body.timezone || typeof body.timezone !== 'string') {
      return errorResponse('Invalid schedule: timezone is required', 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    if (!body.weeklySchedule || typeof body.weeklySchedule !== 'object') {
      return errorResponse('Invalid schedule: weeklySchedule is required', 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    await saveSchedule(id, body);

    return successResponse(body);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to update schedule: ${errorMessage}`) as NextResponse<
      ApiResponse<ServerSchedule>
    >;
  }
}

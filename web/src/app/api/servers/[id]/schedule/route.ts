import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_GET_SCHEDULE_FAILED,
  ERROR_SCHEDULE_ENABLED_MUST_BE_BOOLEAN,
  ERROR_SCHEDULE_TIMEZONE_REQUIRED,
  ERROR_SCHEDULE_WEEKLY_REQUIRED,
  ERROR_UPDATE_SCHEDULE_FAILED,
  withErrorContext,
} from '@/lib/errorMessages';
import { getSchedule, saveSchedule } from '@/lib/scheduler';
import type { ApiResponse, ServerIdParams, ServerSchedule } from '@/types';

// GET /api/servers/[id]/schedule - スケジュール設定取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
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
    console.error(ERROR_GET_SCHEDULE_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(withErrorContext(ERROR_GET_SCHEDULE_FAILED, errorMessage)) as NextResponse<
      ApiResponse<ServerSchedule>
    >;
  }
}

// PUT /api/servers/[id]/schedule - スケジュール設定更新
export async function PUT(
  request: Request,
  { params }: ServerIdParams
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
      return errorResponse(ERROR_SCHEDULE_ENABLED_MUST_BE_BOOLEAN, 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    if (!body.timezone || typeof body.timezone !== 'string') {
      return errorResponse(ERROR_SCHEDULE_TIMEZONE_REQUIRED, 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    if (!body.weeklySchedule || typeof body.weeklySchedule !== 'object') {
      return errorResponse(ERROR_SCHEDULE_WEEKLY_REQUIRED, 400) as NextResponse<
        ApiResponse<ServerSchedule>
      >;
    }

    await saveSchedule(id, body);

    return successResponse(body);
  } catch (error) {
    console.error(ERROR_UPDATE_SCHEDULE_FAILED, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(
      withErrorContext(ERROR_UPDATE_SCHEDULE_FAILED, errorMessage)
    ) as NextResponse<ApiResponse<ServerSchedule>>;
  }
}

/**
 * ヘルス状態 API
 * GET: ヘルス状態を取得
 */
import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getServerHealthStatus } from '@/lib/healthMonitor';
import type { ApiResponse, HealthCheckConfig, HealthState, ServerIdParams } from '@/types';

interface HealthStatusResponse {
  enabled: boolean;
  state: HealthState;
  config: HealthCheckConfig;
}

export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<HealthStatusResponse>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<HealthStatusResponse>>;
    }

    const status = await getServerHealthStatus(id);

    return successResponse(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<HealthStatusResponse>>;
  }
}

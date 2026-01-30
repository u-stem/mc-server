/**
 * プラグイン更新チェック API
 * POST: 更新チェックを実行
 * GET: 最新の更新状態を取得
 */
import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { getPluginUpdateState } from '@/lib/automation';
import { checkPluginUpdates, getPluginUpdatesStatus } from '@/lib/pluginUpdater';
import type {
  ApiResponse,
  PluginAutoUpdateConfig,
  PluginUpdateInfo,
  PluginUpdateState,
  ServerIdParams,
} from '@/types';

interface PluginCheckResult {
  updates: PluginUpdateInfo[];
  lastCheckTime: string | null;
}

interface PluginStatusResponse {
  enabled: boolean;
  state: PluginUpdateState;
  config: PluginAutoUpdateConfig;
}

export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<PluginStatusResponse>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<PluginStatusResponse>>;
    }

    const status = await getPluginUpdatesStatus(id);

    return successResponse(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<PluginStatusResponse>>;
  }
}

export async function POST(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<PluginCheckResult>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<PluginCheckResult>>;
    }

    // 更新チェックを実行
    const updates = await checkPluginUpdates(id);

    // 更新状態を取得
    const state = await getPluginUpdateState(id);

    return successResponse({
      updates,
      lastCheckTime: state.lastCheckTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message) as NextResponse<ApiResponse<PluginCheckResult>>;
  }
}

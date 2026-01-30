import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { ERROR_ADD_WHITELIST_FAILED, ERROR_GET_WHITELIST_FAILED } from '@/lib/errorMessages';
import { addToWhitelist, getWhitelist } from '@/lib/rcon';
import { AddPlayerSchema } from '@/lib/validation';
import type { ApiResponse, ServerIdParams, WhitelistEntry } from '@/types';

// GET /api/servers/[id]/whitelist - ホワイトリスト取得
export async function GET(
  _request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse<WhitelistEntry[]>>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response as NextResponse<ApiResponse<WhitelistEntry[]>>;
    }

    const whitelist = await getWhitelist(id);

    return successResponse(whitelist);
  } catch (error) {
    console.error(ERROR_GET_WHITELIST_FAILED, error);
    return errorResponse(ERROR_GET_WHITELIST_FAILED) as NextResponse<ApiResponse<WhitelistEntry[]>>;
  }
}

// POST /api/servers/[id]/whitelist - プレイヤー追加
export async function POST(
  request: Request,
  { params }: ServerIdParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    const body = await request.json();

    // Zodによるプレイヤー名バリデーション
    const parseResult = AddPlayerSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ');
      return errorResponse(errors, 400);
    }

    const rconResult = await addToWhitelist(id, parseResult.data.name);

    return successResponse({ message: rconResult });
  } catch (error) {
    console.error(ERROR_ADD_WHITELIST_FAILED, error);
    return errorResponse(ERROR_ADD_WHITELIST_FAILED);
  }
}

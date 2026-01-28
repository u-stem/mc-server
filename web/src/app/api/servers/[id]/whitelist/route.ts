import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { addToWhitelist, getWhitelist } from '@/lib/rcon';
import { AddPlayerSchema } from '@/lib/validation';
import type { ApiResponse, WhitelistEntry } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/servers/[id]/whitelist - ホワイトリスト取得
export async function GET(
  _request: Request,
  { params }: RouteParams
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
    console.error('Failed to get whitelist:', error);
    return errorResponse('Failed to get whitelist') as NextResponse<ApiResponse<WhitelistEntry[]>>;
  }
}

// POST /api/servers/[id]/whitelist - プレイヤー追加
export async function POST(
  request: Request,
  { params }: RouteParams
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
    console.error('Failed to add to whitelist:', error);
    return errorResponse('Failed to add player to whitelist');
  }
}

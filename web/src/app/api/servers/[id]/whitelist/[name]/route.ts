import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import {
  ERROR_INVALID_PLAYER_NAME_FORMAT,
  ERROR_REMOVE_WHITELIST_FAILED,
} from '@/lib/errorMessages';
import { removeFromWhitelist } from '@/lib/rcon';
import { PlayerNameSchema } from '@/lib/validation';
import type { ApiResponse, PlayerNameParams } from '@/types';

// DELETE /api/servers/[id]/whitelist/[name] - プレイヤー削除
export async function DELETE(
  _request: Request,
  { params }: PlayerNameParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id, name } = await params;

    const result = await validateAndGetServer(id);
    if (!result.success) {
      return result.response;
    }

    // プレイヤー名をバリデーション
    const nameResult = PlayerNameSchema.safeParse(name);
    if (!nameResult.success) {
      return errorResponse(ERROR_INVALID_PLAYER_NAME_FORMAT, 400);
    }

    const rconResult = await removeFromWhitelist(id, name);

    return successResponse({ message: rconResult });
  } catch (error) {
    console.error(ERROR_REMOVE_WHITELIST_FAILED, error);
    return errorResponse(ERROR_REMOVE_WHITELIST_FAILED);
  }
}

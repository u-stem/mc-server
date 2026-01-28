import type { NextResponse } from 'next/server';
import { errorResponse, successResponse, validateAndGetServer } from '@/lib/apiHelpers';
import { removeFromWhitelist } from '@/lib/rcon';
import { PlayerNameSchema } from '@/lib/validation';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; name: string }>;
}

// DELETE /api/servers/[id]/whitelist/[name] - プレイヤー削除
export async function DELETE(
  _request: Request,
  { params }: RouteParams
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
      return errorResponse('Invalid player name format', 400);
    }

    const rconResult = await removeFromWhitelist(id, name);

    return successResponse({ message: rconResult });
  } catch (error) {
    console.error('Failed to remove from whitelist:', error);
    return errorResponse('Failed to remove player from whitelist');
  }
}

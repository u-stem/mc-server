import { NextResponse } from 'next/server';
import { getServer } from '@/lib/config';
import { ERROR_INVALID_SERVER_ID, ERROR_SERVER_NOT_FOUND } from '@/lib/errorMessages';
import { ServerIdSchema } from '@/lib/validation';
import type { ApiResponse, ServerConfig } from '@/types';

/**
 * APIエラーレスポンスを生成
 */
export function errorResponse(message: string, status: number = 500): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * API成功レスポンスを生成
 */
export function successResponse<T>(data?: T): NextResponse<ApiResponse<T>> {
  if (data !== undefined) {
    return NextResponse.json({ success: true, data });
  }
  return NextResponse.json({ success: true }) as NextResponse<ApiResponse<T>>;
}

/**
 * サーバーIDをバリデーションし、無効な場合はエラーレスポンスを返す
 */
export function validateServerId(
  id: string
): { valid: true; id: string } | { valid: false; response: NextResponse<ApiResponse> } {
  const result = ServerIdSchema.safeParse(id);
  if (!result.success) {
    return {
      valid: false,
      response: errorResponse(ERROR_INVALID_SERVER_ID, 400),
    };
  }
  return { valid: true, id };
}

/**
 * サーバーIDのバリデーションとサーバー取得を行う
 * 失敗時はエラーレスポンスを返す
 */
export async function validateAndGetServer(
  id: string
): Promise<
  { success: true; server: ServerConfig } | { success: false; response: NextResponse<ApiResponse> }
> {
  const validation = validateServerId(id);
  if (!validation.valid) {
    return { success: false, response: validation.response };
  }

  const server = await getServer(id);
  if (!server) {
    return {
      success: false,
      response: errorResponse(ERROR_SERVER_NOT_FOUND, 404),
    };
  }

  return { success: true, server };
}

/**
 * APIハンドラーをラップしてエラーハンドリングを共通化
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>,
  errorMessage: string
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error) => {
    console.error(`${errorMessage}:`, error);
    const message = error instanceof Error ? error.message : errorMessage;
    return errorResponse(message, 500) as NextResponse<ApiResponse<T>>;
  });
}

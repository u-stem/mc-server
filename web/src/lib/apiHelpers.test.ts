import { describe, expect, it, vi } from 'vitest';
import { errorResponse, successResponse, validateServerId } from './apiHelpers';

// getServer モックをvitest.mock経由でセットアップ
vi.mock('./config', () => ({
  getServer: vi.fn(),
}));

describe('errorResponse', () => {
  it('デフォルトでステータス500のエラーレスポンスを返す', async () => {
    const response = errorResponse('Something went wrong');
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: 'Something went wrong',
    });
  });

  it('カスタムステータスコードを設定できる', async () => {
    const response = errorResponse('Not found', 404);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: 'Not found',
    });
  });

  it('400 Bad Requestを返すことができる', async () => {
    const response = errorResponse('Invalid input', 400);
    expect(response.status).toBe(400);
  });
});

describe('successResponse', () => {
  it('データなしの成功レスポンスを返す', async () => {
    const response = successResponse();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
    });
  });

  it('データ付きの成功レスポンスを返す', async () => {
    const data = { id: '123', name: 'test' };
    const response = successResponse(data);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { id: '123', name: 'test' },
    });
  });

  it('配列データを返すことができる', async () => {
    const data = [1, 2, 3];
    const response = successResponse(data);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [1, 2, 3],
    });
  });

  it('null値もデータとして返すことができる', async () => {
    const response = successResponse(null);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: null,
    });
  });
});

describe('validateServerId', () => {
  it('"default"をサーバーIDとして受け入れる', () => {
    const result = validateServerId('default');
    expect(result).toEqual({ valid: true, id: 'default' });
  });

  it('有効なUUID形式のサーバーIDを受け入れる', () => {
    const result = validateServerId('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toEqual({ valid: true, id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('別のUUID形式も受け入れる', () => {
    const result = validateServerId('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
    expect(result).toEqual({ valid: true, id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
  });

  it('無効なID形式に対してエラーレスポンスを返す', async () => {
    const result = validateServerId('my-server-1');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.response.status).toBe(400);
    }
  });

  it('空文字列に対してエラーレスポンスを返す', async () => {
    const result = validateServerId('');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe('Invalid server ID format');
    }
  });

  it('特殊文字を含むIDに対してエラーレスポンスを返す', async () => {
    const result = validateServerId('../etc/passwd');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.response.status).toBe(400);
    }
  });

  it('スラッシュを含むIDに対してエラーレスポンスを返す', async () => {
    const result = validateServerId('server/id');
    expect(result.valid).toBe(false);
  });

  it('バックスラッシュを含むIDに対してエラーレスポンスを返す', async () => {
    const result = validateServerId('server\\id');
    expect(result.valid).toBe(false);
  });
});

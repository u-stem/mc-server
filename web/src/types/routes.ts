/**
 * API Route の共通型定義
 */
import type { NextResponse } from 'next/server';
import type { ApiResponse } from './api';

/**
 * 基本パラメータ型（id のみ）
 */
export interface ServerIdParams {
  params: Promise<{ id: string }>;
}

/**
 * ファイル名を含むパラメータ型
 */
export interface FilenameParams {
  params: Promise<{ id: string; filename: string }>;
}

/**
 * バックアップIDを含むパラメータ型
 */
export interface BackupIdParams {
  params: Promise<{ id: string; backupId: string }>;
}

/**
 * プレイヤー名を含むパラメータ型
 */
export interface PlayerNameParams {
  params: Promise<{ id: string; name: string }>;
}

/**
 * 汎用 Route パラメータ型（カスタムパラメータ用）
 */
export type RouteParams<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<{ id: string } & T>;
};

/**
 * API レスポンス型のエイリアス
 */
export type ApiDeleteResponse = NextResponse<ApiResponse<{ deleted: boolean }>>;
export type ApiSuccessResponse<T> = NextResponse<ApiResponse<T>>;

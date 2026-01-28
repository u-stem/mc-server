// API レスポンス
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// バージョン更新リクエスト
export interface VersionUpdateRequest {
  version: string;
  createBackup?: boolean; // default: true
}

// バージョン更新レスポンス
export interface VersionUpdateResponse {
  previousVersion: string;
  newVersion: string;
  backupPath?: string;
}

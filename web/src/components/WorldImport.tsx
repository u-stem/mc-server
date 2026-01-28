'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_WORLD_UPLOAD_SIZE } from '@/lib/constants';
import { formatSize } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import { Alert } from './Alert';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { Spinner } from './Spinner';

interface WorldInfo {
  exists: boolean;
  size?: number;
  modifiedAt?: string;
}

interface WorldImportProps {
  serverId: string;
  serverRunning?: boolean;
}

export function WorldImport({ serverId, serverRunning = false }: WorldImportProps) {
  const [worldInfo, setWorldInfo] = useState<WorldInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWorldInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/world`);
      const data: ApiResponse<WorldInfo> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch world info');
      }

      setWorldInfo(data.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchWorldInfo();
  }, [fetchWorldInfo]);

  const handleUpload = async (file: File, overwrite: boolean) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwrite', overwrite ? 'true' : 'false');

      const res = await fetch(`/api/servers/${serverId}/world/import`, {
        method: 'POST',
        body: formData,
      });

      const data: ApiResponse<{ message: string }> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to import world');
      }

      setSuccess(data.data?.message || 'ワールドをインポートしました');
      await fetchWorldInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
      setConfirmOverwrite(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // ファイル形式チェック
    if (!file.name.endsWith('.zip') && !file.name.endsWith('.tar.gz')) {
      setError('対応していないファイル形式です。.zip または .tar.gz を使用してください');
      return;
    }

    // サイズチェック
    if (file.size > MAX_WORLD_UPLOAD_SIZE) {
      setError(`ファイルサイズが上限（${formatSize(MAX_WORLD_UPLOAD_SIZE)}）を超えています`);
      return;
    }

    // 既存ワールドがある場合は確認ダイアログを表示
    if (worldInfo?.exists) {
      setConfirmOverwrite(file);
    } else {
      await handleUpload(file, false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-lg">ワールドインポート</h3>
            <p className="text-sm text-gray-400 mt-1">
              {loading ? (
                '読み込み中...'
              ) : worldInfo?.exists ? (
                <>現在のワールド: {worldInfo.size ? formatSize(worldInfo.size) : '不明'}</>
              ) : (
                'ワールドがありません'
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {serverRunning && (
            <Alert variant="warning">
              サーバーが起動中です。ワールドをインポートするにはサーバーを停止してください。
            </Alert>
          )}

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* ドラッグ&ドロップエリア */}
          <label
            htmlFor="world-file-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              serverRunning
                ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed opacity-50'
                : isDragOver
                  ? 'border-green-500 bg-green-900/20 cursor-pointer'
                  : 'border-gray-600 hover:border-gray-500 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              id="world-file-input"
              type="file"
              accept=".zip,.tar.gz"
              className="hidden"
              disabled={serverRunning || uploading}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span className="text-gray-400">インポート中...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">
                  ワールドファイル（.zip または .tar.gz）をドラッグ&ドロップ
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  またはクリックしてファイルを選択（最大{formatSize(MAX_WORLD_UPLOAD_SIZE)}）
                </p>
              </>
            )}
          </label>

          {worldInfo?.exists && (
            <p className="text-xs text-gray-500 mt-3">
              既存のワールドがある場合、インポート時にバックアップが作成されます。
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOverwrite !== null}
        title="ワールドを上書き"
        message="既存のワールドがあります。上書きしますか？現在のワールドはバックアップとして保存されます。"
        confirmLabel="上書き"
        variant="warning"
        loading={uploading}
        onConfirm={() => confirmOverwrite && handleUpload(confirmOverwrite, true)}
        onCancel={() => setConfirmOverwrite(null)}
      />
    </>
  );
}

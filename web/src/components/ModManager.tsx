'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';
import { MSG_DRAG_DROP_JAR, MSG_LOADING, MSG_NO_MODS } from '@/lib/messages';
import { formatDate, formatFilename, formatSize, isJarFile } from '@/lib/utils';
import type { ApiResponse, ModInfo } from '@/types';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';

interface ModManagerProps {
  serverId: string;
  serverRunning?: boolean;
}

export function ModManager({ serverId, serverRunning = false }: ModManagerProps) {
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMods = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/mods`);
      const data: ApiResponse<ModInfo[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch mods');
      }

      setMods(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchMods();
  }, [fetchMods]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        if (!isJarFile(file.name)) {
          throw new Error(`${file.name} は .jar ファイルではありません`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/servers/${serverId}/mods`, {
          method: 'POST',
          body: formData,
        });

        const data: ApiResponse<ModInfo> = await res.json();

        if (!data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }

      await fetchMods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}/mods/${encodeURIComponent(deleteTarget)}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<{ deleted: boolean }> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete mod');
      }

      await fetchMods();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (filename: string) => {
    setToggling(filename);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}/mods/${encodeURIComponent(filename)}`, {
        method: 'PATCH',
      });

      const data: ApiResponse<ModInfo> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle mod');
      }

      await fetchMods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setToggling(null);
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
    handleUpload(e.dataTransfer.files);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Mod管理</h3>
            <p className="text-sm text-gray-400 mt-1">
              {mods.length} 件のMod（{mods.filter((m) => m.enabled).length} 件有効）
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              id="mod-file-input"
              type="file"
              accept=".jar"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              disabled={uploading}
            >
              Modをアップロード
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {serverRunning && (
            <Alert variant="warning">
              サーバーが起動中です。Modの変更を反映するにはサーバーを再起動してください。
            </Alert>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          {/* ドラッグ&ドロップエリア */}
          <label
            htmlFor="mod-file-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`block mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-green-500 bg-green-900/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <p className="text-gray-400 text-sm">{MSG_DRAG_DROP_JAR}</p>
            <p className="text-gray-500 text-xs mt-2">
              Modは{' '}
              <a
                href={EXTERNAL_URLS.MODRINTH_MODS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline"
              >
                Modrinth
              </a>{' '}
              や{' '}
              <a
                href={EXTERNAL_URLS.CURSE_FORGE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline"
              >
                CurseForge
              </a>{' '}
              からダウンロードできます
            </p>
          </label>

          {loading ? (
            <EmptyState message={MSG_LOADING} />
          ) : mods.length === 0 ? (
            <EmptyState message={MSG_NO_MODS} />
          ) : (
            <ul className="space-y-2">
              {mods.map((mod) => (
                <li
                  key={mod.filename}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    mod.enabled ? 'bg-gray-700/50' : 'bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        mod.enabled ? 'bg-purple-600/20' : 'bg-gray-600/20'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${mod.enabled ? 'text-purple-400' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatFilename(mod.filename)}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(mod.modifiedAt)} · {formatSize(mod.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* トグルスイッチ */}
                    <button
                      type="button"
                      onClick={() => handleToggle(mod.filename)}
                      disabled={toggling === mod.filename}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        mod.enabled ? 'bg-green-600' : 'bg-gray-600'
                      } ${toggling === mod.filename ? 'opacity-50' : ''}`}
                      title={mod.enabled ? '無効にする' : '有効にする'}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          mod.enabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {/* 削除ボタン */}
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteTarget(mod.filename)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      削除
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Modを削除"
        message={`${deleteTarget ? formatFilename(deleteTarget) : ''} を削除しますか？この操作は取り消せません。`}
        confirmLabel="削除"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EXTERNAL_URLS, PLUGIN_DOCS } from '@/lib/constants';
import { MSG_DRAG_DROP_JAR, MSG_LOADING, MSG_NO_PLUGINS } from '@/lib/messages';
import { formatDate, formatFilename, formatSize, isJarFile } from '@/lib/utils';
import type { ApiResponse, PluginInfo } from '@/types';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { InlineCode } from './CodeBlock';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';

// おすすめプラグインの定義（クライアント側用）
const RECOMMENDED_PLUGINS = [
  {
    id: 'spark',
    name: 'Spark',
    description: 'パフォーマンス監視・プロファイラ。サーバーの負荷原因を特定できます。',
    category: 'performance' as const,
    commands: ['/spark profiler', '/spark tps', '/spark health'],
    docsUrl: PLUGIN_DOCS.SPARK,
  },
  {
    id: 'luckperms',
    name: 'LuckPerms',
    description: '権限管理プラグイン。プレイヤーの権限を細かく設定できます。',
    category: 'management' as const,
    commands: ['/lp editor', '/lp user <name> info', '/lp group <name> info'],
    docsUrl: PLUGIN_DOCS.LUCK_PERMS,
  },
  {
    id: 'chunky',
    name: 'Chunky',
    description: 'ワールド事前生成ツール。探索時のラグを軽減できます。',
    category: 'performance' as const,
    commands: ['/chunky start', '/chunky radius <blocks>', '/chunky pause'],
    docsUrl: PLUGIN_DOCS.CHUNKY,
  },
  {
    id: 'geyser',
    name: 'GeyserMC',
    description:
      '統合版（Bedrock）プレイヤーがJava版サーバーに参加可能に。スマホ/Switch/Xbox/PS等からの接続をサポート。',
    category: 'crossplay' as const,
    commands: ['/geyser reload', '/geyser version'],
    docsUrl: PLUGIN_DOCS.GEYSER,
  },
  {
    id: 'floodgate',
    name: 'Floodgate',
    description: 'GeyserMCと併用。統合版プレイヤーがJava版アカウント無しで参加可能に。',
    category: 'crossplay' as const,
    commands: ['/floodgate whitelist add <name>'],
    docsUrl: PLUGIN_DOCS.FLOODGATE,
  },
];

interface PluginManagerProps {
  serverId: string;
  serverRunning?: boolean;
}

export function PluginManager({ serverId, serverRunning = false }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPlugins = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/plugins`);
      const data: ApiResponse<PluginInfo[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch plugins');
      }

      setPlugins(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

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

        const res = await fetch(`/api/servers/${serverId}/plugins`, {
          method: 'POST',
          body: formData,
        });

        const data: ApiResponse<PluginInfo> = await res.json();

        if (!data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }

      await fetchPlugins();
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
      const res = await fetch(
        `/api/servers/${serverId}/plugins/${encodeURIComponent(deleteTarget)}`,
        {
          method: 'DELETE',
        }
      );

      const data: ApiResponse<{ deleted: boolean }> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete plugin');
      }

      await fetchPlugins();
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
      const res = await fetch(`/api/servers/${serverId}/plugins/${encodeURIComponent(filename)}`, {
        method: 'PATCH',
      });

      const data: ApiResponse<PluginInfo> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle plugin');
      }

      await fetchPlugins();
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

  const handleInstallRecommended = async (pluginId: string) => {
    setInstalling(pluginId);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}/plugins/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId }),
      });

      const data: ApiResponse<PluginInfo> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to install plugin');
      }

      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setInstalling(null);
    }
  };

  // インストール済みかどうかをチェック（ファイル名の一部で判定）
  const isPluginInstalled = (pluginId: string) => {
    const lowerPluginId = pluginId.toLowerCase();
    return plugins.some((p) => p.filename.toLowerCase().includes(lowerPluginId));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">プラグイン管理</h3>
            <p className="text-sm text-gray-400 mt-1">
              {plugins.length} 件のプラグイン（{plugins.filter((p) => p.enabled).length} 件有効）
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              id="plugin-file-input"
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
              プラグインをアップロード
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {serverRunning && (
            <Alert variant="warning">
              サーバーが起動中です。プラグインの変更を反映するにはサーバーを再起動してください。
            </Alert>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          {/* ドラッグ&ドロップエリア */}
          <label
            htmlFor="plugin-file-input"
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
              プラグインは{' '}
              <a
                href={EXTERNAL_URLS.HANGAR}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline"
              >
                Hangar
              </a>{' '}
              や{' '}
              <a
                href={EXTERNAL_URLS.SPIGOT_MC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline"
              >
                SpigotMC
              </a>{' '}
              や{' '}
              <a
                href={EXTERNAL_URLS.MODRINTH_PLUGINS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline"
              >
                Modrinth
              </a>{' '}
              からダウンロードできます
            </p>
          </label>

          {loading ? (
            <EmptyState message={MSG_LOADING} />
          ) : plugins.length === 0 ? (
            <EmptyState message={MSG_NO_PLUGINS} />
          ) : (
            <ul className="space-y-2">
              {plugins.map((plugin) => (
                <li
                  key={plugin.filename}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    plugin.enabled ? 'bg-gray-700/50' : 'bg-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plugin.enabled ? 'bg-blue-600/20' : 'bg-gray-600/20'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${plugin.enabled ? 'text-blue-400' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatFilename(plugin.filename)}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(plugin.modifiedAt)} · {formatSize(plugin.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* トグルスイッチ */}
                    <button
                      type="button"
                      onClick={() => handleToggle(plugin.filename)}
                      disabled={toggling === plugin.filename}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        plugin.enabled ? 'bg-green-600' : 'bg-gray-600'
                      } ${toggling === plugin.filename ? 'opacity-50' : ''}`}
                      title={plugin.enabled ? '無効にする' : '有効にする'}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          plugin.enabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {/* 削除ボタン */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(plugin.filename)}
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

      {/* おすすめプラグイン */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold text-lg">おすすめプラグイン</h3>
          <p className="text-sm text-gray-400 mt-1">ワンクリックでインストールできます</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECOMMENDED_PLUGINS.map((plugin) => {
              const installed = isPluginInstalled(plugin.id);
              return (
                <div
                  key={plugin.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    installed
                      ? 'bg-gray-700/50 border-green-700/50'
                      : 'bg-gray-700/30 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{plugin.name}</h4>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            plugin.category === 'performance'
                              ? 'bg-green-900/50 text-green-400'
                              : plugin.category === 'crossplay'
                                ? 'bg-purple-900/50 text-purple-400'
                                : 'bg-blue-900/50 text-blue-400'
                          }`}
                        >
                          {plugin.category === 'performance'
                            ? 'パフォーマンス'
                            : plugin.category === 'crossplay'
                              ? 'クロスプレイ'
                              : '管理'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{plugin.description}</p>
                    </div>
                  </div>

                  {installed ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        インストール済み
                      </div>
                      <div className="pt-2 border-t border-gray-600">
                        <p className="text-xs text-gray-500 mb-1">主なコマンド:</p>
                        <div className="flex flex-wrap gap-1">
                          {plugin.commands.slice(0, 2).map((cmd) => (
                            <InlineCode key={cmd} className="text-xs">
                              {cmd}
                            </InlineCode>
                          ))}
                        </div>
                        <a
                          href={plugin.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 hover:underline mt-2"
                        >
                          ドキュメントを見る
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleInstallRecommended(plugin.id)}
                        loading={installing === plugin.id}
                        disabled={installing !== null}
                      >
                        インストール
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            プラグインは{' '}
            <a
              href={EXTERNAL_URLS.MODRINTH_PLUGINS}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              Modrinth
            </a>{' '}
            からダウンロードされます
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="プラグインを削除"
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

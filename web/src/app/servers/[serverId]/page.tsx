'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { AutomationSettings } from '@/components/AutomationSettings';
import { BackupManager } from '@/components/BackupManager';
import { BasicSettingsTab } from '@/components/BasicSettingsTab';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { CodeBlock } from '@/components/CodeBlock';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Console } from '@/components/Console';
import { HelpPage } from '@/components/HelpPage';
import { Frown } from '@/components/Icons';
import { ModManager } from '@/components/ModManager';
import { PlayerManager } from '@/components/PlayerManager';
import { PluginManager } from '@/components/PluginManager';
import { ScheduleSettings } from '@/components/ScheduleSettings';
import { ServerPropertiesTab } from '@/components/ServerPropertiesTab';
import { Spinner } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { VersionTab } from '@/components/VersionTab';
import { WhitelistManager } from '@/components/WhitelistManager';
import { WorldImport } from '@/components/WorldImport';
import { useTailscaleIp } from '@/hooks/useTailscaleIp';
import { POLLING_INTERVAL_STATUS, UI_SERVER_REFRESH_DELAY_MS } from '@/lib/constants';
import {
  LABEL_BACK,
  LABEL_BACK_TO_DASHBOARD,
  MSG_SERVER_NOT_FOUND,
  MSG_SERVER_NOT_FOUND_DESC,
} from '@/lib/messages';
import type { ApiResponse, ModInfo, PluginInfo, ServerDetails, TpsInfo } from '@/types';
import { getPresetById, isBedrockServer, isModServer, isPluginServer, supportsTps } from '@/types';

interface PageProps {
  params: Promise<{ serverId: string }>;
}

// TPSに応じた色クラスを返す
function getTpsColorClass(tps: number): string {
  if (tps >= 19.5) return 'text-green-400';
  if (tps >= 18) return 'text-yellow-400';
  return 'text-red-400';
}

// TPS表示コンポーネント
function TpsDisplay({ tps }: { tps: TpsInfo }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-lg font-mono ${getTpsColorClass(tps.tps1m)}`}>
        {tps.tps1m.toFixed(1)}
      </span>
      <span className="text-xs text-gray-500">
        ({tps.tps5m.toFixed(1)}, {tps.tps15m.toFixed(1)})
      </span>
    </div>
  );
}

type TabId =
  | 'overview'
  | 'console'
  | 'players'
  | 'mods'
  | 'backups'
  | 'settings'
  | 'properties'
  | 'version'
  | 'schedule'
  | 'automation'
  | 'help';

interface Tab {
  id: TabId;
  label: string;
  show?: boolean;
}

export default function ServerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { serverId } = use(params);
  const [server, setServer] = useState<ServerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { ip: tailscaleIp } = useTailscaleIp();
  const [modCount, setModCount] = useState<number | null>(null);
  const [pluginCount, setPluginCount] = useState<number | null>(null);

  const fetchServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}`);
      const data: ApiResponse<ServerDetails> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch server');
      }

      setServer(data.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchServer();
    const interval = setInterval(fetchServer, POLLING_INTERVAL_STATUS);
    return () => clearInterval(interval);
  }, [fetchServer]);

  useEffect(() => {
    async function fetchModCount() {
      if (!server || !isModServer(server.type)) {
        setModCount(null);
        return;
      }
      try {
        const res = await fetch(`/api/servers/${serverId}/mods`);
        const data: ApiResponse<ModInfo[]> = await res.json();
        if (data.success && data.data) {
          setModCount(data.data.length);
        }
      } catch {
        // Mod取得失敗
      }
    }
    fetchModCount();
  }, [server, serverId]);

  useEffect(() => {
    async function fetchPluginCount() {
      if (!server || !isPluginServer(server.type)) {
        setPluginCount(null);
        return;
      }
      try {
        const res = await fetch(`/api/servers/${serverId}/plugins`);
        const data: ApiResponse<PluginInfo[]> = await res.json();
        if (data.success && data.data) {
          setPluginCount(data.data.length);
        }
      } catch {
        // プラグイン取得失敗
      }
    }
    fetchPluginCount();
  }, [server, serverId]);

  const handleStart = async () => {
    setActionLoading('start');
    try {
      const res = await fetch(`/api/servers/${serverId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start');
      addToast('success', 'サーバーを起動しています...');
      setTimeout(fetchServer, UI_SERVER_REFRESH_DELAY_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', `起動に失敗しました: ${message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading('stop');
    try {
      const res = await fetch(`/api/servers/${serverId}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop');
      addToast('success', 'サーバーを停止しました');
      setTimeout(fetchServer, UI_SERVER_REFRESH_DELAY_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', `停止に失敗しました: ${message}`);
    } finally {
      setActionLoading(null);
      setShowStopConfirm(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/servers/${serverId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      addToast('success', 'サーバーを削除しました');
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', `削除に失敗しました: ${message}`);
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <output
        className="flex items-center justify-center min-h-[400px]"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">サーバーを読み込み中...</p>
        </div>
      </output>
    );
  }

  if (error || !server) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="alert">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Frown className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{MSG_SERVER_NOT_FOUND}</h2>
          <p className="text-gray-400 mb-6">{error || MSG_SERVER_NOT_FOUND_DESC}</p>
          <Button onClick={() => router.push('/')}>{LABEL_BACK_TO_DASHBOARD}</Button>
        </div>
      </div>
    );
  }

  const isBedrock = isBedrockServer(server.type);
  const showModsTab = isModServer(server.type);
  const showPluginsTab = isPluginServer(server.type);
  const preset = getPresetById(server.presetId || 'balanced');

  const getExtensionTabLabel = () => {
    if (showModsTab && showPluginsTab) return 'Mod / プラグイン';
    if (showModsTab) return 'Mod';
    if (showPluginsTab) return 'プラグイン';
    return 'Mod / プラグイン';
  };

  const allTabs: Tab[] = [
    { id: 'overview', label: '概要' },
    { id: 'console', label: 'コンソール', show: !isBedrock }, // BedrockはRCONがないためコンソール非表示
    { id: 'players', label: 'プレイヤー', show: !isBedrock }, // Bedrockはホワイトリスト管理が異なるため非表示
    {
      id: 'mods',
      label: getExtensionTabLabel(),
      show: !isBedrock && (showModsTab || showPluginsTab),
    },
    { id: 'backups', label: 'バックアップ' },
    { id: 'settings', label: '基本設定', show: !isBedrock },
    { id: 'properties', label: 'サーバー設定', show: !isBedrock },
    { id: 'version', label: 'バージョン', show: !isBedrock },
    { id: 'schedule', label: 'スケジュール' },
    { id: 'automation', label: 'オートメーション', show: !isBedrock },
    { id: 'help', label: 'ヘルプ' },
  ];
  const tabs = allTabs.filter((tab) => tab.show !== false);

  return (
    <div>
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white inline-flex items-center"
            >
              {LABEL_BACK}
            </Link>
            <span className="text-gray-600">|</span>
            <h2 className="text-xl font-bold">サーバー詳細</h2>
            <StatusBadge running={server.status.running} />
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            {server.status.running ? (
              <Button
                variant="danger"
                onClick={() => setShowStopConfirm(true)}
                loading={actionLoading === 'stop'}
                disabled={actionLoading !== null}
              >
                停止
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  loading={actionLoading === 'start'}
                  disabled={actionLoading !== null}
                >
                  起動
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  loading={actionLoading === 'delete'}
                  disabled={actionLoading !== null}
                >
                  削除
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-700 mb-6">
        <div
          className="flex gap-1 overflow-x-auto pb-px"
          role="tablist"
          aria-label="サーバー管理タブ"
          onKeyDown={(e) => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              const nextIndex = (currentIndex + 1) % tabs.length;
              setActiveTab(tabs[nextIndex].id);
              (e.currentTarget.children[nextIndex] as HTMLElement)?.focus();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              setActiveTab(tabs[prevIndex].id);
              (e.currentTarget.children[prevIndex] as HTMLElement)?.focus();
            } else if (e.key === 'Home') {
              e.preventDefault();
              setActiveTab(tabs[0].id);
              (e.currentTarget.children[0] as HTMLElement)?.focus();
            } else if (e.key === 'End') {
              e.preventDefault();
              setActiveTab(tabs[tabs.length - 1].id);
              (e.currentTarget.children[tabs.length - 1] as HTMLElement)?.focus();
            }
          }}
        >
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          id="tabpanel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className={activeTab === 'overview' ? '' : 'hidden'}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">プレイヤー</p>
              <p className="text-2xl font-bold">
                {server.status.players.online}
                <span className="text-gray-500 text-sm font-normal ml-1">
                  / {server.maxPlayers}
                </span>
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">稼働時間</p>
              <p className="text-lg font-medium truncate">{server.status.uptime || '-'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CPU</p>
              <p className="text-lg font-mono">{server.status.cpu || '-'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">メモリ</p>
              <p className="text-lg font-mono truncate">
                {server.status.memory ? server.status.memory.used : '-'}
              </p>
            </div>
            {supportsTps(server.type) && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  TPS
                  <span className="ml-1 text-gray-600 normal-case">(1m, 5m, 15m)</span>
                </p>
                {server.status.tps ? (
                  <TpsDisplay tps={server.status.tps} />
                ) : (
                  <p className="text-lg font-mono text-gray-500">-</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">接続情報</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isBedrock && (
                    <div className="mb-2 p-2 bg-blue-900/20 border border-blue-700/50 rounded text-sm text-blue-300">
                      統合版（Bedrock）サーバー - UDP接続
                    </div>
                  )}
                  {tailscaleIp && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tailscale</p>
                      <CodeBlock>{`${tailscaleIp}:${server.port}`}</CodeBlock>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ローカル</span>
                    <span className="text-gray-300">localhost:{server.port}</span>
                  </div>
                  {!isBedrock && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">RCONポート</span>
                      <span className="text-gray-300">{server.rconPort}</span>
                    </div>
                  )}
                  {server.geyserPort && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">GeyserMC (UDP)</p>
                      <CodeBlock>{`${server.geyserPort}`}</CodeBlock>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">サーバー情報</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">サーバー名</span>
                    <span className="font-medium">{server.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">エディション</span>
                    <span className="font-medium">
                      {isBedrock ? '統合版（Bedrock）' : 'Java版'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">タイプ</span>
                    <span className="font-medium">
                      {server.type} {server.version}
                    </span>
                  </div>
                  {!isBedrock && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">メモリ割り当て</span>
                      <span className="font-mono">{server.memory}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">プリセット</span>
                    <span className="font-medium">{preset?.name || 'バランス'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">最大人数</span>
                    <span>{server.maxPlayers}人</span>
                  </div>
                  {!isBedrock && showModsTab && modCount !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Mod</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('mods')}
                        className="text-green-400 hover:text-green-300 hover:underline"
                      >
                        {modCount}個インストール済み
                      </button>
                    </div>
                  )}
                  {!isBedrock && showPluginsTab && pluginCount !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">プラグイン</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('mods')}
                        className="text-green-400 hover:text-green-300 hover:underline"
                      >
                        {pluginCount}個インストール済み
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {server.status.players.list.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <h3 className="font-semibold">
                    オンラインプレイヤー
                    <span className="ml-2 text-gray-500 font-normal">
                      ({server.status.players.online})
                    </span>
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {server.status.players.list.map((name) => (
                      <span
                        key={name}
                        className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div
          id="tabpanel-console"
          role="tabpanel"
          aria-labelledby="tab-console"
          className={activeTab === 'console' ? '' : 'hidden'}
        >
          <Console serverId={serverId} isRunning={server.status.running} />
        </div>

        <div
          id="tabpanel-players"
          role="tabpanel"
          aria-labelledby="tab-players"
          className={activeTab === 'players' ? '' : 'hidden'}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <WhitelistManager serverId={serverId} />
            <PlayerManager
              serverId={serverId}
              isRunning={server.status.running}
              onlinePlayers={server.status.players.list}
            />
          </div>
        </div>

        <div
          id="tabpanel-mods"
          role="tabpanel"
          aria-labelledby="tab-mods"
          className={activeTab === 'mods' ? '' : 'hidden'}
        >
          {showModsTab && showPluginsTab ? (
            <div className="space-y-6">
              <ModManager serverId={serverId} serverRunning={server.status.running} />
              <PluginManager serverId={serverId} serverRunning={server.status.running} />
            </div>
          ) : showModsTab ? (
            <ModManager serverId={serverId} serverRunning={server.status.running} />
          ) : showPluginsTab ? (
            <PluginManager serverId={serverId} serverRunning={server.status.running} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">拡張機能は使用できません</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {server.type} サーバーではModやプラグインを使用できません。
                  </p>
                  <p className="text-gray-500 text-sm mt-4">
                    Modを使用するには Fabric / Forge / NeoForge / Quilt を、
                    プラグインを使用するには Spigot / Paper / Purpur / Folia を選択してください。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div
          id="tabpanel-backups"
          role="tabpanel"
          aria-labelledby="tab-backups"
          className={activeTab === 'backups' ? 'space-y-6' : 'hidden'}
        >
          <BackupManager serverId={serverId} />
          <WorldImport serverId={serverId} serverRunning={server.status.running} />
        </div>

        <div
          id="tabpanel-settings"
          role="tabpanel"
          aria-labelledby="tab-settings"
          className={activeTab === 'settings' ? '' : 'hidden'}
        >
          <BasicSettingsTab serverId={serverId} server={server} onUpdate={fetchServer} />
        </div>

        <div
          id="tabpanel-properties"
          role="tabpanel"
          aria-labelledby="tab-properties"
          className={activeTab === 'properties' ? '' : 'hidden'}
        >
          <ServerPropertiesTab serverId={serverId} serverRunning={server.status.running} />
        </div>

        <div
          id="tabpanel-version"
          role="tabpanel"
          aria-labelledby="tab-version"
          className={activeTab === 'version' ? '' : 'hidden'}
        >
          <VersionTab
            serverId={serverId}
            currentVersion={server.version}
            serverType={server.type}
            onVersionUpdated={(newVersion) => {
              setServer((prev) => (prev ? { ...prev, version: newVersion } : null));
            }}
          />
        </div>

        <div
          id="tabpanel-schedule"
          role="tabpanel"
          aria-labelledby="tab-schedule"
          className={activeTab === 'schedule' ? '' : 'hidden'}
        >
          <ScheduleSettings serverId={serverId} />
        </div>

        <div
          id="tabpanel-automation"
          role="tabpanel"
          aria-labelledby="tab-automation"
          className={activeTab === 'automation' ? '' : 'hidden'}
        >
          <AutomationSettings serverId={serverId} serverType={server.type} />
        </div>

        <div
          id="tabpanel-help"
          role="tabpanel"
          aria-labelledby="tab-help"
          className={activeTab === 'help' ? '' : 'hidden'}
        >
          <HelpPage server={server} />
        </div>
      </div>

      <ConfirmDialog
        open={showStopConfirm}
        title="サーバーを停止しますか？"
        message={`${server.name} を停止します。接続中のプレイヤーは切断されます。`}
        confirmLabel="停止する"
        variant="danger"
        loading={actionLoading === 'stop'}
        onConfirm={handleStop}
        onCancel={() => setShowStopConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="サーバーを削除しますか？"
        message={`${server.name} を削除します。この操作は取り消せません。ワールドデータは保持されますが、設定は削除されます。`}
        confirmLabel="削除する"
        variant="danger"
        loading={actionLoading === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

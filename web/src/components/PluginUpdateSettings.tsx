'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  ApiResponse,
  PluginAutoUpdateConfig,
  PluginUpdateInfo,
  PluginUpdateState,
} from '@/types';
import { DEFAULT_PLUGIN_UPDATE_STATE } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';
import { useToast } from './Toast';

interface PluginUpdateSettingsProps {
  serverId: string;
  config: PluginAutoUpdateConfig;
  onSave: (config: PluginAutoUpdateConfig) => Promise<boolean>;
}

export function PluginUpdateSettings({ serverId, config, onSave }: PluginUpdateSettingsProps) {
  const { addToast } = useToast();
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [updateState, setUpdateState] = useState<PluginUpdateState>(DEFAULT_PLUGIN_UPDATE_STATE);

  // propsの変更を監視してローカル状態を同期
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const fetchUpdateState = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/automation/plugins/check`);
      const data: ApiResponse<{ state: PluginUpdateState }> = await res.json();

      if (data.success && data.data) {
        setUpdateState(data.data.state);
      }
    } catch {
      // 無視
    }
  }, [serverId]);

  useEffect(() => {
    fetchUpdateState();
  }, [fetchUpdateState]);

  const handleChange = (updates: Partial<PluginAutoUpdateConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(localConfig);
    if (success) {
      setHasChanges(false);
    }
    setSaving(false);
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/automation/plugins/check`, {
        method: 'POST',
      });

      const data: ApiResponse<{ updates: PluginUpdateInfo[] }> = await res.json();

      if (data.success && data.data) {
        const availableUpdates = data.data.updates.filter((u) => u.updateAvailable);
        if (availableUpdates.length > 0) {
          addToast('info', `${availableUpdates.length}件のプラグイン更新があります`);
        } else {
          addToast('success', 'すべてのプラグインは最新です');
        }
        await fetchUpdateState();
      } else {
        addToast('error', data.error || 'チェックに失敗しました');
      }
    } catch {
      addToast('error', 'チェックに失敗しました');
    } finally {
      setChecking(false);
    }
  };

  const availableUpdates = updateState.updates.filter((u) => u.updateAvailable);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">プラグイン更新チェック</h3>
          <p className="text-sm text-gray-400 mt-1">Modrinthから最新バージョンをチェック</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCheckNow} loading={checking}>
            今すぐチェック
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            保存
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 更新状態表示 */}
          {updateState.lastCheckTime && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">
                  最終チェック: {new Date(updateState.lastCheckTime).toLocaleString('ja-JP')}
                </p>
                {availableUpdates.length > 0 && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    {availableUpdates.length}件の更新あり
                  </span>
                )}
              </div>

              {availableUpdates.length > 0 ? (
                <div className="space-y-2">
                  {availableUpdates.map((update) => (
                    <div
                      key={update.pluginName}
                      className="flex items-center justify-between text-sm p-2 bg-gray-700/50 rounded"
                    >
                      <span className="font-medium">{update.pluginName}</span>
                      <span>
                        <span className="text-gray-400">{update.currentVersion}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-400">{update.latestVersion}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">すべてのプラグインは最新です</p>
              )}
            </div>
          )}

          {/* 有効/無効トグル */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) => handleChange({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  localConfig.enabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  localConfig.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="font-medium">自動チェックを有効化</span>
          </label>

          {localConfig.enabled && (
            <>
              {/* チェック間隔 */}
              <div className="max-w-xs">
                <Input
                  label="チェック間隔（時間）"
                  type="number"
                  value={localConfig.checkIntervalHours}
                  onChange={(e) => handleChange({ checkIntervalHours: Number(e.target.value) })}
                  min={1}
                  max={168}
                  helperText="1〜168時間（1週間）"
                />
              </div>

              {/* 通知設定 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.notifyOnUpdate}
                  onChange={(e) => handleChange({ notifyOnUpdate: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                />
                <div>
                  <span className="font-medium">更新検出時に通知</span>
                  <p className="text-sm text-gray-400">Discord通知が有効な場合に送信</p>
                </div>
              </label>

              {/* 除外プラグイン */}
              <div>
                <Input
                  label="除外するプラグイン"
                  value={localConfig.excludePlugins.join(', ')}
                  onChange={(e) =>
                    handleChange({
                      excludePlugins: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="plugin1, plugin2"
                  helperText="カンマ区切りでプラグイン名を入力"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

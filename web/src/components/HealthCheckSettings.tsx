'use client';

import { useCallback, useEffect, useState } from 'react';
import { POLLING_INTERVAL_HEALTH_STATE } from '@/lib/constants';
import type { ApiResponse, HealthCheckConfig, HealthState } from '@/types';
import { DEFAULT_HEALTH_STATE } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';

interface HealthCheckSettingsProps {
  serverId: string;
  config: HealthCheckConfig;
  onSave: (config: HealthCheckConfig) => Promise<boolean>;
}

const STATUS_LABELS = {
  healthy: { text: '正常', className: 'text-green-400' },
  warning: { text: '警告', className: 'text-yellow-400' },
  critical: { text: '危険', className: 'text-red-400' },
  unknown: { text: '不明', className: 'text-gray-400' },
};

export function HealthCheckSettings({ serverId, config, onSave }: HealthCheckSettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [healthState, setHealthState] = useState<HealthState>(DEFAULT_HEALTH_STATE);

  // propsの変更を監視してローカル状態を同期
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const fetchHealthState = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/automation/health`);
      const data: ApiResponse<{ state: HealthState }> = await res.json();

      if (data.success && data.data) {
        setHealthState(data.data.state);
      }
    } catch {
      // 無視
    }
  }, [serverId]);

  useEffect(() => {
    fetchHealthState();
    const interval = setInterval(fetchHealthState, POLLING_INTERVAL_HEALTH_STATE);
    return () => clearInterval(interval);
  }, [fetchHealthState]);

  const handleChange = (updates: Partial<HealthCheckConfig>) => {
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

  const statusInfo = STATUS_LABELS[healthState.currentStatus];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">ヘルスチェック＆自動再起動</h3>
          <p className="text-sm text-gray-400 mt-1">サーバーの健全性を監視し、問題時に自動対応</p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
          保存
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 現在のステータス */}
          {localConfig.enabled && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">現在のステータス</p>
                  <p className={`text-lg font-medium ${statusInfo.className}`}>{statusInfo.text}</p>
                </div>
                {healthState.lastCheckTime && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">最終チェック</p>
                    <p className="text-sm">
                      {new Date(healthState.lastCheckTime).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
              {healthState.lastTps !== null && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">TPS: </span>
                    <span className="font-mono">{healthState.lastTps.toFixed(1)}</span>
                  </div>
                  {healthState.lastMemoryPercent !== null && (
                    <div>
                      <span className="text-gray-400">メモリ: </span>
                      <span className="font-mono">{healthState.lastMemoryPercent.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
              {healthState.consecutiveFailures > 0 && (
                <p className="mt-2 text-sm text-yellow-400">
                  連続失敗: {healthState.consecutiveFailures}回
                </p>
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
            <span className="font-medium">ヘルスチェックを有効化</span>
          </label>

          {localConfig.enabled && (
            <>
              {/* チェック間隔 */}
              <div className="max-w-xs">
                <Input
                  label="チェック間隔（秒）"
                  type="number"
                  value={localConfig.checkIntervalSeconds}
                  onChange={(e) => handleChange({ checkIntervalSeconds: Number(e.target.value) })}
                  min={30}
                  max={600}
                  helperText="30秒以上を推奨"
                />
              </div>

              {/* 閾値設定 */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Input
                  label="TPS閾値"
                  type="number"
                  value={localConfig.tpsThreshold}
                  onChange={(e) => handleChange({ tpsThreshold: Number(e.target.value) })}
                  min={1}
                  max={20}
                  helperText="この値を下回ると警告"
                />
                <Input
                  label="メモリ使用率閾値 (%)"
                  type="number"
                  value={localConfig.memoryThresholdPercent}
                  onChange={(e) => handleChange({ memoryThresholdPercent: Number(e.target.value) })}
                  min={50}
                  max={100}
                  helperText="この値を超えると警告"
                />
              </div>

              {/* 自動再起動設定 */}
              <div className="pt-4 border-t border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={localConfig.autoRestart}
                      onChange={(e) => handleChange({ autoRestart: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${
                        localConfig.autoRestart ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    />
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        localConfig.autoRestart ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  <span className="font-medium">自動再起動を有効化</span>
                </label>

                {localConfig.autoRestart && (
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <Input
                      label="連続失敗回数"
                      type="number"
                      value={localConfig.consecutiveFailures}
                      onChange={(e) =>
                        handleChange({ consecutiveFailures: Number(e.target.value) })
                      }
                      min={1}
                      max={10}
                      helperText="この回数連続で失敗すると再起動"
                    />
                    <Input
                      label="クールダウン（分）"
                      type="number"
                      value={localConfig.restartCooldownMinutes}
                      onChange={(e) =>
                        handleChange({ restartCooldownMinutes: Number(e.target.value) })
                      }
                      min={1}
                      max={60}
                      helperText="再起動後の待機時間"
                    />
                  </div>
                )}
              </div>

              {/* クラッシュ検出 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.crashDetection}
                  onChange={(e) => handleChange({ crashDetection: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                />
                <div>
                  <span className="font-medium">クラッシュ検出</span>
                  <p className="text-sm text-gray-400">予期しないサーバー停止を検出して通知</p>
                </div>
              </label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

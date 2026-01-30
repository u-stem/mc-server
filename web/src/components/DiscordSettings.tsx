'use client';

import { useEffect, useState } from 'react';
import type { ApiResponse, DiscordWebhookConfig } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';
import { useToast } from './Toast';

interface DiscordSettingsProps {
  serverId: string;
  config: DiscordWebhookConfig;
  onSave: (config: DiscordWebhookConfig) => Promise<boolean>;
}

export function DiscordSettings({ serverId, config, onSave }: DiscordSettingsProps) {
  const { addToast } = useToast();
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // propsの変更を監視してローカル状態を同期
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleChange = (updates: Partial<DiscordWebhookConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleThresholdChange = (
    key: keyof DiscordWebhookConfig['alertThresholds'],
    value: number
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      alertThresholds: { ...prev.alertThresholds, [key]: value },
    }));
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

  const handleTest = async () => {
    if (!localConfig.webhookUrl) {
      addToast('error', 'Webhook URLを入力してください');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/automation/discord/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: localConfig.webhookUrl }),
      });

      const data: ApiResponse<void> = await res.json();

      if (data.success) {
        addToast('success', 'テスト通知を送信しました');
      } else {
        addToast('error', data.error || 'テスト送信に失敗しました');
      }
    } catch {
      addToast('error', 'テスト送信に失敗しました');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">Discord通知</h3>
          <p className="text-sm text-gray-400 mt-1">
            サーバーイベントをDiscordに通知（プレイヤー参加/退出はDiscordプラグインを使用）
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
          保存
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
            <span className="font-medium">Discord通知を有効化</span>
          </label>

          {localConfig.enabled && (
            <>
              {/* Webhook URL */}
              <div>
                <label
                  htmlFor="webhook-url"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="webhook-url"
                    type="url"
                    value={localConfig.webhookUrl}
                    onChange={(e) => handleChange({ webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleTest}
                    loading={testing}
                    disabled={!localConfig.webhookUrl}
                  >
                    テスト
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  サーバー設定 → 連携サービス → Webhookから取得
                </p>
              </div>

              {/* 通知設定 */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">通知するイベント</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnStart}
                      onChange={(e) => handleChange({ notifyOnStart: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">サーバー起動</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnStop}
                      onChange={(e) => handleChange({ notifyOnStop: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">サーバー停止</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnCrash}
                      onChange={(e) => handleChange({ notifyOnCrash: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">クラッシュ検出</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnAlert}
                      onChange={(e) => handleChange({ notifyOnAlert: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">ヘルスアラート</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnBackup}
                      onChange={(e) => handleChange({ notifyOnBackup: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">バックアップ完了</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyOnPluginUpdate}
                      onChange={(e) => handleChange({ notifyOnPluginUpdate: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">プラグイン更新</span>
                  </label>
                </div>
              </div>

              {/* アラート閾値 */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">アラート閾値</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="TPS警告"
                    type="number"
                    value={localConfig.alertThresholds.tpsWarning}
                    onChange={(e) => handleThresholdChange('tpsWarning', Number(e.target.value))}
                    min={1}
                    max={20}
                    helperText="この値を下回ると警告"
                  />
                  <Input
                    label="TPS危険"
                    type="number"
                    value={localConfig.alertThresholds.tpsCritical}
                    onChange={(e) => handleThresholdChange('tpsCritical', Number(e.target.value))}
                    min={1}
                    max={20}
                    helperText="この値を下回ると危険"
                  />
                  <Input
                    label="メモリ警告 (%)"
                    type="number"
                    value={localConfig.alertThresholds.memoryWarning}
                    onChange={(e) => handleThresholdChange('memoryWarning', Number(e.target.value))}
                    min={50}
                    max={100}
                    helperText="この値を超えると警告"
                  />
                  <Input
                    label="メモリ危険 (%)"
                    type="number"
                    value={localConfig.alertThresholds.memoryCritical}
                    onChange={(e) =>
                      handleThresholdChange('memoryCritical', Number(e.target.value))
                    }
                    min={50}
                    max={100}
                    helperText="この値を超えると危険"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

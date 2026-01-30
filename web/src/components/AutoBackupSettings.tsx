'use client';

import { useEffect, useState } from 'react';
import type { AutoBackupConfig } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';
import { Select } from './Select';

interface AutoBackupSettingsProps {
  config: AutoBackupConfig;
  onSave: (config: AutoBackupConfig) => Promise<boolean>;
}

const DAY_OPTIONS = [
  { value: '0', label: '日曜日' },
  { value: '1', label: '月曜日' },
  { value: '2', label: '火曜日' },
  { value: '3', label: '水曜日' },
  { value: '4', label: '木曜日' },
  { value: '5', label: '金曜日' },
  { value: '6', label: '土曜日' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function AutoBackupSettings({ config, onSave }: AutoBackupSettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // propsの変更を監視してローカル状態を同期
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleChange = (updates: Partial<AutoBackupConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleRetentionChange = (key: keyof AutoBackupConfig['retention'], value: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      retention: { ...prev.retention, [key]: value },
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">自動バックアップ</h3>
          <p className="text-sm text-gray-400 mt-1">定期的なバックアップと保持ポリシー</p>
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
            <span className="font-medium">自動バックアップを有効化</span>
          </label>

          {localConfig.enabled && (
            <>
              {/* スケジュールタイプ */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">バックアップスケジュール</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.scheduleType === 'daily'}
                      onChange={() => handleChange({ scheduleType: 'daily' })}
                      className="w-4 h-4 bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span>毎日</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.scheduleType === 'weekly'}
                      onChange={() => handleChange({ scheduleType: 'weekly' })}
                      className="w-4 h-4 bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span>毎週</span>
                  </label>
                </div>
              </div>

              {/* 時刻設定 */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {localConfig.scheduleType === 'daily' ? (
                  <Select
                    label="バックアップ時刻"
                    value={localConfig.dailyTime}
                    onChange={(e) => handleChange({ dailyTime: e.target.value })}
                    options={TIME_OPTIONS}
                  />
                ) : (
                  <>
                    <Select
                      label="曜日"
                      value={String(localConfig.weeklyDay)}
                      onChange={(e) => handleChange({ weeklyDay: Number(e.target.value) })}
                      options={DAY_OPTIONS}
                    />
                    <Select
                      label="時刻"
                      value={localConfig.weeklyTime}
                      onChange={(e) => handleChange({ weeklyTime: e.target.value })}
                      options={TIME_OPTIONS}
                    />
                  </>
                )}
              </div>

              {/* イベントトリガー */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">イベント時バックアップ</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.backupOnStart}
                      onChange={(e) => handleChange({ backupOnStart: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">サーバー起動時</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.backupOnStop}
                      onChange={(e) => handleChange({ backupOnStop: e.target.checked })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm">サーバー停止時</span>
                  </label>
                </div>
              </div>

              {/* バックアップタイプ */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">バックアップ種類</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.backupType === 'world'}
                      onChange={() => handleChange({ backupType: 'world' })}
                      className="w-4 h-4 bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span>ワールドのみ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={localConfig.backupType === 'full'}
                      onChange={() => handleChange({ backupType: 'full' })}
                      className="w-4 h-4 bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    />
                    <span>フルバックアップ</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  フルバックアップはワールド、プラグイン/Mod、設定ファイルを含みます
                </p>
              </div>

              {/* 保持ポリシー */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">保持ポリシー</p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <Input
                    label="最大保持数"
                    type="number"
                    value={localConfig.retention.maxCount}
                    onChange={(e) => handleRetentionChange('maxCount', Number(e.target.value))}
                    min={1}
                    max={100}
                    helperText="この数を超えると古いものから削除"
                  />
                  <Input
                    label="最大保持日数"
                    type="number"
                    value={localConfig.retention.maxAgeDays}
                    onChange={(e) => handleRetentionChange('maxAgeDays', Number(e.target.value))}
                    min={1}
                    max={365}
                    helperText="この日数を超えると削除"
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

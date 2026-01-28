'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse, DaySchedule, ServerSchedule } from '@/types';
import { DEFAULT_SERVER_SCHEDULE } from '@/types';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Select } from './Select';
import { useToast } from './Toast';

interface ScheduleSettingsProps {
  serverId: string;
}

const DAY_NAMES = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
];

const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function ScheduleSettings({ serverId }: ScheduleSettingsProps) {
  const { addToast } = useToast();
  const [schedule, setSchedule] = useState<ServerSchedule>(DEFAULT_SERVER_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [bulkTarget, setBulkTarget] = useState<'weekdays' | 'weekend' | 'all'>('weekdays');
  const [bulkStart, setBulkStart] = useState('20:00');
  const [bulkEnd, setBulkEnd] = useState('23:00');

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/schedule`);
      const data: ApiResponse<ServerSchedule> = await res.json();

      if (data.success && data.data) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      addToast('error', 'スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [serverId, addToast]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      const data: ApiResponse<ServerSchedule> = await res.json();

      if (data.success) {
        setHasChanges(false);
        addToast('success', 'スケジュールを保存しました');
      } else {
        addToast('error', data.error || '保存に失敗しました');
      }
    } catch {
      addToast('error', '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (updates: Partial<ServerSchedule>) => {
    setSchedule((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateDaySchedule = (day: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: { ...prev.weeklySchedule[day], ...updates },
      },
    }));
    setHasChanges(true);
  };

  const applyBulkSettings = () => {
    const days =
      bulkTarget === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : bulkTarget === 'weekend'
          ? [0, 6]
          : [0, 1, 2, 3, 4, 5, 6];

    const newWeeklySchedule = { ...schedule.weeklySchedule };
    for (const day of days) {
      newWeeklySchedule[day] = {
        enabled: true,
        startTime: bulkStart,
        endTime: bulkEnd,
      };
    }
    setSchedule((prev) => ({ ...prev, weeklySchedule: newWeeklySchedule }));
    setHasChanges(true);
    addToast('success', '一括設定を適用しました');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">スケジュール設定</h3>
          <p className="text-sm text-gray-400 mt-1">サーバーの自動起動・停止を設定</p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
          保存
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => updateSchedule({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  schedule.enabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  schedule.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="font-medium">スケジュールを有効化</span>
          </label>

          {schedule.enabled && (
            <>
              <div className="max-w-xs">
                <Select
                  label="タイムゾーン"
                  value={schedule.timezone}
                  onChange={(e) => updateSchedule({ timezone: e.target.value })}
                  options={TIMEZONE_OPTIONS}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 font-medium text-gray-400">曜日</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-400">有効</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-400">開始</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-400">終了</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const daySchedule = schedule.weeklySchedule[day];
                      return (
                        <tr
                          key={day}
                          className={`border-b border-gray-700/50 ${
                            !daySchedule?.enabled ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-medium">{DAY_NAMES[day]}</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={daySchedule?.enabled || false}
                              onChange={(e) =>
                                updateDaySchedule(day, { enabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={daySchedule?.startTime || '20:00'}
                              onChange={(e) =>
                                updateDaySchedule(day, { startTime: e.target.value })
                              }
                              disabled={!daySchedule?.enabled}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm disabled:opacity-50"
                            >
                              {TIME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={daySchedule?.endTime || '23:00'}
                              onChange={(e) => updateDaySchedule(day, { endTime: e.target.value })}
                              disabled={!daySchedule?.enabled}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm disabled:opacity-50"
                            >
                              {TIME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-3">一括設定</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center max-w-md">
                  <span className="text-sm text-gray-300">対象</span>
                  <Select
                    value={bulkTarget}
                    onChange={(e) => setBulkTarget(e.target.value as typeof bulkTarget)}
                    options={[
                      { value: 'weekdays', label: '平日（月〜金）' },
                      { value: 'weekend', label: '週末（土日）' },
                      { value: 'all', label: '全曜日' },
                    ]}
                  />
                  <span className="text-sm text-gray-300">時間</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={bulkStart}
                      onChange={(e) => setBulkStart(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500">〜</span>
                    <select
                      value={bulkEnd}
                      onChange={(e) => setBulkEnd(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div />
                  <Button variant="secondary" onClick={applyBulkSettings}>
                    適用
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                スケジュールが有効な場合、設定した時間帯にサーバーが自動的に起動・停止します。
                手動での操作は次のスケジュールチェック時に上書きされます。
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

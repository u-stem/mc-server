'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { ApiResponse, CreateServerRequest, PresetSettings, ServerConfig } from '@/types';
import { DEFAULT_PRESET_SETTINGS, getPresetById } from '@/types';
import { AdvancedSettings } from './AdvancedSettings';
import { Button } from './Button';
import { Card, CardContent, CardHeader } from './Card';
import { Input } from './Input';
import { PresetSelector } from './PresetSelector';
import { Select } from './Select';
import { useToast } from './Toast';

interface BasicSettingsTabProps {
  serverId: string;
  server: {
    name: string;
    port: number;
    rconPort: number;
    version: string;
    type: string;
    memory: string;
    maxPlayers: number;
    presetId?: string;
    advancedSettings?: Record<string, unknown>;
  };
  onUpdate?: () => void;
  /** 'card' = Card wrapper付き (default), 'plain' = wrapper無し */
  variant?: 'card' | 'plain';
}

const serverTypes = [
  { value: 'FABRIC', label: 'Fabric', group: 'MOD' },
  { value: 'FORGE', label: 'Forge', group: 'MOD' },
  { value: 'NEOFORGE', label: 'NeoForge', group: 'MOD' },
  { value: 'QUILT', label: 'Quilt', group: 'MOD' },
  { value: 'VANILLA', label: 'Vanilla', group: 'Plugin' },
  { value: 'SPIGOT', label: 'Spigot', group: 'Plugin' },
  { value: 'PAPER', label: 'Paper', group: 'Plugin' },
  { value: 'PURPUR', label: 'Purpur', group: 'Plugin' },
  { value: 'FOLIA', label: 'Folia', group: 'Plugin' },
  { value: 'MOHIST', label: 'Mohist', group: 'Hybrid' },
  { value: 'ARCLIGHT', label: 'Arclight', group: 'Hybrid' },
  { value: 'CATSERVER', label: 'CatServer', group: 'Hybrid' },
];

const memoryOptions = [
  { value: '2G', label: '2 GB' },
  { value: '4G', label: '4 GB' },
  { value: '6G', label: '6 GB' },
  { value: '8G', label: '8 GB' },
];

const serverSchema = z
  .object({
    name: z.string().min(1, 'サーバー名は必須です').max(50, 'サーバー名は50文字以内'),
    port: z.number().min(1024, 'ポートは1024以上').max(65535, 'ポートは65535以下'),
    rconPort: z.number().min(1024, 'RCONポートは1024以上').max(65535, 'RCONポートは65535以下'),
    rconPassword: z.string().optional(),
    version: z.string().min(1, 'バージョンは必須です'),
    type: z.enum([
      'FABRIC',
      'FORGE',
      'NEOFORGE',
      'QUILT',
      'VANILLA',
      'SPIGOT',
      'PAPER',
      'PURPUR',
      'FOLIA',
      'MOHIST',
      'ARCLIGHT',
      'CATSERVER',
    ]),
    memory: z.string(),
    maxPlayers: z.number().min(1, '最小1人').max(100, '最大100人'),
    presetId: z.string().optional(),
    advancedSettings: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => data.port !== data.rconPort, {
    message: 'ゲームポートとRCONポートは異なる値にしてください',
    path: ['rconPort'],
  });

type FieldErrors = Partial<Record<keyof CreateServerRequest | 'root', string>>;

export function BasicSettingsTab({
  serverId,
  server,
  onUpdate,
  variant = 'card',
}: BasicSettingsTabProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<CreateServerRequest>({
    name: server.name,
    port: server.port,
    rconPort: server.rconPort,
    rconPassword: '',
    version: server.version,
    type: server.type as CreateServerRequest['type'],
    memory: server.memory,
    maxPlayers: server.maxPlayers,
    presetId: server.presetId || 'balanced',
    advancedSettings: server.advancedSettings || {},
  });

  useEffect(() => {
    setFormData({
      name: server.name,
      port: server.port,
      rconPort: server.rconPort,
      rconPassword: '',
      version: server.version,
      type: server.type as CreateServerRequest['type'],
      memory: server.memory,
      maxPlayers: server.maxPlayers,
      presetId: server.presetId || 'balanced',
      advancedSettings: server.advancedSettings || {},
    });
  }, [server]);

  const currentPresetSettings: PresetSettings =
    getPresetById(formData.presetId || 'balanced')?.settings || DEFAULT_PRESET_SETTINGS;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handlePresetChange = (presetId: string) => {
    setFormData((prev) => ({
      ...prev,
      presetId,
      advancedSettings: {},
    }));
  };

  const handleAdvancedSettingsChange = (settings: Partial<PresetSettings>) => {
    setFormData((prev) => ({
      ...prev,
      advancedSettings: settings,
    }));
  };

  const validateForm = (): boolean => {
    const result = serverSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateServerRequest;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const submitData = { ...formData };
      if (!submitData.rconPassword) {
        delete (submitData as Partial<CreateServerRequest>).rconPassword;
      }

      const res = await fetch(`/api/servers/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data: ApiResponse<ServerConfig> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update server');
      }

      addToast('success', '基本設定を保存しました');
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {variant === 'plain' && (
        <div className="flex justify-end mb-4">
          <Button type="submit" form="edit-basic-form" loading={loading}>
            保存
          </Button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      <form id="edit-basic-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="サーバー名"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          error={fieldErrors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ゲームポート"
            name="port"
            type="number"
            value={formData.port}
            onChange={handleChange}
            min={1024}
            max={65535}
            required
            error={fieldErrors.port}
          />
          <Input
            label="RCONポート"
            name="rconPort"
            type="number"
            value={formData.rconPort}
            onChange={handleChange}
            min={1024}
            max={65535}
            required
            error={fieldErrors.rconPort}
          />
        </div>

        <Input
          label="RCONパスワード（変更する場合のみ）"
          name="rconPassword"
          type="password"
          value={formData.rconPassword}
          onChange={handleChange}
          placeholder="空欄の場合は変更しません"
          error={fieldErrors.rconPassword}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="サーバータイプ"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={serverTypes}
          />
          <Input
            label="バージョン"
            name="version"
            value={formData.version}
            onChange={handleChange}
            placeholder="1.21.1"
            required
            error={fieldErrors.version}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="メモリ"
            name="memory"
            value={formData.memory}
            onChange={handleChange}
            options={memoryOptions}
          />
          <Input
            label="最大プレイヤー数"
            name="maxPlayers"
            type="number"
            value={formData.maxPlayers}
            onChange={handleChange}
            min={1}
            max={100}
            required
            error={fieldErrors.maxPlayers}
          />
        </div>

        <div className="pt-4 border-t border-gray-700">
          <PresetSelector
            selectedPresetId={formData.presetId || 'balanced'}
            onSelect={handlePresetChange}
          />
        </div>

        <AdvancedSettings
          settings={formData.advancedSettings || {}}
          baseSettings={currentPresetSettings}
          onChange={handleAdvancedSettingsChange}
        />
      </form>
    </>
  );

  if (variant === 'plain') {
    return content;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">基本設定</h3>
          <p className="text-sm text-gray-400 mt-1">サーバーの基本設定とプリセット</p>
        </div>
        <Button type="submit" form="edit-basic-form" loading={loading}>
          保存
        </Button>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

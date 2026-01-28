'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { Accordion } from '@/components/Accordion';
import { AdvancedSettings } from '@/components/AdvancedSettings';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Frown } from '@/components/Icons';
import { Input } from '@/components/Input';
import { PresetSelector } from '@/components/PresetSelector';
import { Select } from '@/components/Select';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import {
  LABEL_BACK,
  LABEL_BACK_TO_DASHBOARD,
  MSG_LOADING,
  MSG_SERVER_NOT_FOUND,
  MSG_SERVER_NOT_FOUND_DESC,
} from '@/lib/messages';
import type {
  ApiResponse,
  CreateServerRequest,
  PresetSettings,
  PropertyCategory,
  ServerConfig,
  ServerDetails,
  VersionUpdateResponse,
} from '@/types';
import { DEFAULT_PRESET_SETTINGS, getPresetById, PROPERTY_CATEGORIES } from '@/types';

interface PageProps {
  params: Promise<{ serverId: string }>;
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

interface ServerProperties {
  [key: string]: string | number | boolean;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export default function EditServerPage({ params }: PageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { serverId } = use(params);

  const [server, setServer] = useState<ServerDetails | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic settings state
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<CreateServerRequest>({
    name: '',
    port: 25565,
    rconPort: 25575,
    rconPassword: '',
    version: '1.21.1',
    type: 'FABRIC',
    memory: '4G',
    maxPlayers: 10,
    presetId: 'balanced',
    advancedSettings: {},
  });

  // Properties state
  const [properties, setProperties] = useState<ServerProperties | null>(null);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesSaving, setPropertiesSaving] = useState(false);
  const [propertiesHasChanges, setPropertiesHasChanges] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PropertyCategory>('gameplay');

  // Version state
  const [newVersion, setNewVersion] = useState('');
  const [versionUpdating, setVersionUpdating] = useState(false);
  const [showVersionConfirm, setShowVersionConfirm] = useState(false);
  const [createBackup, setCreateBackup] = useState(true);

  const currentPresetSettings: PresetSettings =
    getPresetById(formData.presetId || 'balanced')?.settings || DEFAULT_PRESET_SETTINGS;

  // Fetch server data
  useEffect(() => {
    async function fetchServer() {
      try {
        const res = await fetch(`/api/servers/${serverId}`);
        const data: ApiResponse<ServerDetails> = await res.json();

        if (data.success && data.data) {
          const s = data.data;
          setServer(s);
          setFormData({
            name: s.name,
            port: s.port,
            rconPort: s.rconPort,
            rconPassword: '',
            version: s.version,
            type: s.type,
            memory: s.memory,
            maxPlayers: s.maxPlayers,
            presetId: s.presetId || 'balanced',
            advancedSettings: s.advancedSettings || {},
          });
          setNewVersion(s.version);
        } else {
          setError('サーバーが見つかりません');
        }
      } catch {
        setError('サーバーの読み込みに失敗しました');
      } finally {
        setInitializing(false);
      }
    }
    fetchServer();
  }, [serverId]);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/properties`);
      const data: ApiResponse<ServerProperties> = await res.json();
      if (data.success && data.data) {
        setProperties(data.data);
      }
    } catch {
      addToast('error', 'サーバー設定の取得に失敗しました');
    } finally {
      setPropertiesLoading(false);
    }
  }, [serverId, addToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Basic settings handlers
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

  const handleBasicSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Properties handlers
  const handlePropertyChange = (key: string, value: string | number | boolean) => {
    if (!properties) return;
    setProperties({ ...properties, [key]: value });
    setPropertiesHasChanges(true);
  };

  const handlePropertiesSave = async () => {
    if (!properties || !propertiesHasChanges) return;

    setPropertiesSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(properties),
      });

      const data: ApiResponse<ServerProperties> = await res.json();

      if (data.success) {
        setProperties(data.data || properties);
        setPropertiesHasChanges(false);
        addToast('success', '設定を保存しました。変更を反映するにはサーバーを再起動してください。');
      } else {
        addToast('error', data.error || '設定の保存に失敗しました');
      }
    } catch {
      addToast('error', '設定の保存に失敗しました');
    } finally {
      setPropertiesSaving(false);
    }
  };

  const handlePropertiesReset = () => {
    fetchProperties();
    setPropertiesHasChanges(false);
  };

  // Version handlers
  const versionChanged = server ? newVersion !== server.version : false;
  const isDowngrade =
    versionChanged && server ? compareVersions(newVersion, server.version) < 0 : false;
  const isValidVersion = /^\d+\.\d+(\.\d+)?$/.test(newVersion);

  const handleVersionUpdate = async () => {
    if (!isValidVersion) {
      addToast('error', 'バージョン形式が正しくありません（例: 1.21.1）');
      return;
    }

    setVersionUpdating(true);
    setShowVersionConfirm(false);

    try {
      const res = await fetch(`/api/servers/${serverId}/version`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: newVersion, createBackup }),
      });

      const data: ApiResponse<VersionUpdateResponse> = await res.json();

      if (data.success && data.data) {
        const { previousVersion, newVersion: updatedVersion, backupPath } = data.data;
        let message = `バージョンを ${previousVersion} から ${updatedVersion} に更新しました`;
        if (backupPath) message += `（バックアップ作成済み）`;
        addToast('success', message);
        setServer((prev) => (prev ? { ...prev, version: updatedVersion } : null));
      } else {
        addToast('error', data.error || 'バージョン更新に失敗しました');
      }
    } catch {
      addToast('error', 'バージョン更新に失敗しました');
    } finally {
      setVersionUpdating(false);
    }
  };

  const renderProperty = (
    prop: (typeof PROPERTY_CATEGORIES)[PropertyCategory]['properties'][number]
  ) => {
    if (!properties) return null;
    const value = properties[prop.key as keyof ServerProperties];

    switch (prop.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handlePropertyChange(prop.key, e.target.checked)}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
            />
            <span>{prop.label}</span>
          </label>
        );
      case 'select':
        return (
          <Select
            label={prop.label}
            value={value as string}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
            options={(prop.options ?? []).map((opt) => ({ value: opt, label: opt }))}
          />
        );
      case 'number':
        return (
          <Input
            label={prop.label}
            type="number"
            value={value as number}
            onChange={(e) => handlePropertyChange(prop.key, parseInt(e.target.value, 10) || 0)}
            min={prop.min}
            max={prop.max}
          />
        );
      default:
        return (
          <Input
            label={prop.label}
            type="text"
            value={value as string}
            onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
          />
        );
    }
  };

  if (initializing) {
    return (
      <output className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-400">{MSG_LOADING}</p>
        </div>
      </output>
    );
  }

  if (error && !server) {
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

  const categories = Object.entries(PROPERTY_CATEGORIES) as [
    PropertyCategory,
    (typeof PROPERTY_CATEGORIES)[PropertyCategory],
  ][];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/servers/${serverId}`}
            className="text-sm text-gray-400 hover:text-white inline-flex items-center"
          >
            {LABEL_BACK}
          </Link>
          <span className="text-gray-600">|</span>
          <h2 className="text-xl font-bold">サーバー編集</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* 基本設定 */}
        <Accordion title="基本設定" defaultOpen>
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <Button type="submit" form="edit-basic-form" loading={loading}>
                保存
              </Button>
            </div>
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            <form id="edit-basic-form" onSubmit={handleBasicSubmit} className="space-y-4">
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
                label="RCONパスワード"
                name="rconPassword"
                type="password"
                value={formData.rconPassword}
                onChange={handleChange}
                placeholder="変更する場合のみ入力"
                helperText="空欄の場合は変更されません"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="サーバータイプ"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={serverTypes}
                />
                <Select
                  label="メモリ"
                  name="memory"
                  value={formData.memory}
                  onChange={handleChange}
                  options={memoryOptions}
                />
              </div>

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
          </div>
        </Accordion>

        {/* サーバー設定 */}
        <Accordion title="サーバー設定（server.properties）">
          <div className="p-4">
            <div className="flex justify-end gap-2 mb-4">
              {propertiesHasChanges && (
                <Button variant="ghost" onClick={handlePropertiesReset} disabled={propertiesSaving}>
                  リセット
                </Button>
              )}
              <Button
                onClick={handlePropertiesSave}
                loading={propertiesSaving}
                disabled={!propertiesHasChanges}
              >
                保存
              </Button>
            </div>
            {propertiesLoading ? (
              <div className="text-center py-8 text-gray-400">{MSG_LOADING}</div>
            ) : !properties ? (
              <div className="text-center py-8 text-gray-400">設定を読み込めませんでした</div>
            ) : (
              <>
                {server?.status.running && propertiesHasChanges && (
                  <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
                    サーバーが起動中です。設定の変更を反映するには再起動が必要です。
                  </div>
                )}

                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4 overflow-x-auto">
                  {categories.map(([key, category]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                        activeCategory === key
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {PROPERTY_CATEGORIES[activeCategory].properties.map((prop) => (
                    <div key={prop.key}>{renderProperty(prop)}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Accordion>

        {/* バージョン */}
        {server && (
          <Accordion title={`バージョン管理（${server.type} ${server.version}）`}>
            <div className="p-4">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowVersionConfirm(true)}
                  disabled={!versionChanged || !isValidVersion || versionUpdating}
                  loading={versionUpdating}
                >
                  バージョンを更新
                </Button>
              </div>
              <div className="space-y-4">
                <Input
                  label="新しいバージョン"
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="例: 1.21.1"
                  error={
                    newVersion && !isValidVersion ? 'バージョン形式が正しくありません' : undefined
                  }
                />

                {isDowngrade && (
                  <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
                    <strong>警告:</strong> ダウングレードしようとしています。
                    ワールドデータに互換性の問題が発生する可能性があります。
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createBackup}
                    onChange={(e) => setCreateBackup(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm">更新前にフルバックアップを作成（推奨）</span>
                </label>
              </div>
            </div>
          </Accordion>
        )}
      </div>

      <ConfirmDialog
        open={showVersionConfirm}
        title="バージョンを更新"
        message={`${server?.type} ${server?.version} から ${server?.type} ${newVersion} に更新します。${
          createBackup ? 'バックアップが作成されます。' : ''
        }${isDowngrade ? '\n\n警告: ダウングレードはワールドデータに問題を引き起こす可能性があります。' : ''}\n\nサーバーは自動的に再起動されます。`}
        confirmLabel="更新する"
        variant={isDowngrade ? 'warning' : 'default'}
        loading={versionUpdating}
        onConfirm={handleVersionUpdate}
        onCancel={() => setShowVersionConfirm(false)}
      />
    </div>
  );
}

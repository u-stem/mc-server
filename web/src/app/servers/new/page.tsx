'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { AdvancedSettings } from '@/components/AdvancedSettings';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Input } from '@/components/Input';
import { PresetSelector } from '@/components/PresetSelector';
import { Select } from '@/components/Select';
import { useToast } from '@/components/Toast';
import { LABEL_BACK } from '@/lib/messages';
import type {
  ApiResponse,
  CreateServerRequest,
  PresetSettings,
  ServerConfig,
  ServerEdition,
} from '@/types';
import { DEFAULT_PRESET_SETTINGS, getPresetById } from '@/types';

// Java版サーバータイプ
const javaServerTypes = [
  // MOD系
  { value: 'FABRIC', label: 'Fabric', group: 'MOD' },
  { value: 'FORGE', label: 'Forge', group: 'MOD' },
  { value: 'NEOFORGE', label: 'NeoForge', group: 'MOD' },
  { value: 'QUILT', label: 'Quilt', group: 'MOD' },
  // プラグイン系
  { value: 'VANILLA', label: 'Vanilla', group: 'Plugin' },
  { value: 'SPIGOT', label: 'Spigot', group: 'Plugin' },
  { value: 'PAPER', label: 'Paper', group: 'Plugin' },
  { value: 'PURPUR', label: 'Purpur', group: 'Plugin' },
  { value: 'FOLIA', label: 'Folia', group: 'Plugin' },
  // ハイブリッド系
  { value: 'MOHIST', label: 'Mohist', group: 'Hybrid' },
  { value: 'ARCLIGHT', label: 'Arclight', group: 'Hybrid' },
  { value: 'CATSERVER', label: 'CatServer', group: 'Hybrid' },
];

// エディション選択オプション
const editionOptions: { value: ServerEdition; label: string; description: string }[] = [
  {
    value: 'java',
    label: 'Java版',
    description: 'PC向け。Mod/プラグイン対応',
  },
  {
    value: 'bedrock',
    label: '統合版（Bedrock）',
    description: 'スマホ/Switch/Xbox/PS向け',
  },
];

const memoryOptions = [
  { value: '2G', label: '2 GB' },
  { value: '4G', label: '4 GB' },
  { value: '6G', label: '6 GB' },
  { value: '8G', label: '8 GB' },
];

// Java版用バリデーションスキーマ
const javaServerSchema = z
  .object({
    name: z.string().min(1, 'サーバー名は必須です').max(50, 'サーバー名は50文字以内'),
    port: z.number().min(1024, 'ポートは1024以上').max(65535, 'ポートは65535以下'),
    rconPort: z.number().min(1024, 'RCONポートは1024以上').max(65535, 'RCONポートは65535以下'),
    rconPassword: z.string().min(8, 'パスワードは8文字以上'),
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
    edition: z.literal('java').optional(),
    geyserPort: z.number().min(1024).max(65535).optional(),
  })
  .refine((data) => data.port !== data.rconPort, {
    message: 'ゲームポートとRCONポートは異なる値にしてください',
    path: ['rconPort'],
  })
  .refine(
    (data) =>
      !data.geyserPort || (data.geyserPort !== data.port && data.geyserPort !== data.rconPort),
    {
      message: 'GeyserMCポートは他のポートと異なる値にしてください',
      path: ['geyserPort'],
    }
  );

// Bedrock版用バリデーションスキーマ
const bedrockServerSchema = z.object({
  name: z.string().min(1, 'サーバー名は必須です').max(50, 'サーバー名は50文字以内'),
  port: z.number().min(1024, 'ポートは1024以上').max(65535, 'ポートは65535以下'),
  rconPort: z.number().optional(),
  rconPassword: z.string().optional(),
  version: z.string().min(1, 'バージョンは必須です'),
  type: z.literal('BEDROCK'),
  memory: z.string(),
  maxPlayers: z.number().min(1, '最小1人').max(100, '最大100人'),
  presetId: z.string().optional(),
  advancedSettings: z.record(z.string(), z.unknown()).optional(),
  edition: z.literal('bedrock'),
});

type FieldErrors = Partial<Record<keyof CreateServerRequest | 'root', string>>;

// 空いているポートを計算
function findAvailablePort(usedPorts: number[], basePort: number): number {
  let port = basePort;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

export default function NewServerPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedEdition, setSelectedEdition] = useState<ServerEdition>('java');
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
    edition: 'java',
  });

  // エディション変更ハンドラ
  const handleEditionChange = (edition: ServerEdition) => {
    setSelectedEdition(edition);
    setFieldErrors({});

    if (edition === 'bedrock') {
      setFormData((prev) => ({
        ...prev,
        edition: 'bedrock',
        type: 'BEDROCK',
        port: 19132, // Bedrockのデフォルトポート
        rconPort: 0, // BedrockはRCONなし
        rconPassword: '',
        version: '1.21.50', // Bedrockのバージョン
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        edition: 'java',
        type: 'FABRIC',
        port: 25565,
        rconPort: 25575,
        rconPassword: '',
        version: '1.21.1',
      }));
    }
  };

  // 現在選択されているプリセットの設定を取得
  const currentPresetSettings: PresetSettings =
    getPresetById(formData.presetId || 'balanced')?.settings || DEFAULT_PRESET_SETTINGS;

  // 既存サーバーから使用中のポートを取得して空きポートを設定
  useEffect(() => {
    async function fetchAvailablePorts() {
      try {
        const res = await fetch('/api/servers');
        const data: ApiResponse<ServerConfig[]> = await res.json();

        if (data.success && data.data) {
          const usedPorts = data.data.flatMap((s) =>
            [s.port, s.rconPort, s.geyserPort].filter(
              (p): p is number => p !== undefined && p !== 0
            )
          );

          if (selectedEdition === 'java') {
            const availableGamePort = findAvailablePort(usedPorts, 25565);
            const availableRconPort = findAvailablePort(
              [...usedPorts, availableGamePort],
              availableGamePort + 10
            );

            setFormData((prev) => ({
              ...prev,
              port: availableGamePort,
              rconPort: availableRconPort,
            }));
          } else {
            // Bedrock版
            const availablePort = findAvailablePort(usedPorts, 19132);
            setFormData((prev) => ({
              ...prev,
              port: availablePort,
            }));
          }
        }
      } catch {
        // エラー時はデフォルトポートを使用
      } finally {
        setInitializing(false);
      }
    }

    fetchAvailablePorts();
  }, [selectedEdition]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  // プリセット変更時のハンドラ
  const handlePresetChange = (presetId: string) => {
    setFormData((prev) => ({
      ...prev,
      presetId,
      advancedSettings: {}, // プリセット変更時はカスタム設定をリセット
    }));
  };

  // 詳細設定変更時のハンドラ
  const handleAdvancedSettingsChange = (settings: Partial<PresetSettings>) => {
    setFormData((prev) => ({
      ...prev,
      advancedSettings: settings,
    }));
  };

  const validateForm = (): boolean => {
    const schema = selectedEdition === 'bedrock' ? bedrockServerSchema : javaServerSchema;
    const result = schema.safeParse(formData);

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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<ServerConfig> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create server');
      }

      addToast('success', 'サーバーを作成しました');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white inline-flex items-center"
            >
              {LABEL_BACK}
            </Link>
            <span className="text-gray-600">|</span>
            <h2 className="text-xl font-bold">新規サーバー作成</h2>
          </div>
          <Button type="submit" form="create-server-form" loading={loading} disabled={initializing}>
            作成
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">サーバー設定</h3>
          <p className="text-sm text-gray-400 mt-1">新しいMinecraftサーバーの設定を行います</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          <form id="create-server-form" onSubmit={handleSubmit} className="space-y-4">
            {/* エディション選択 */}
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-300 mb-3">エディション</legend>
              <div className="grid grid-cols-2 gap-4">
                {editionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleEditionChange(option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedEdition === option.value
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-white">{option.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
              {selectedEdition === 'java' && (
                <p className="text-xs text-gray-500 mt-2">
                  GeyserMCプラグインを使えば統合版とのクロスプレイも可能です
                </p>
              )}
            </fieldset>

            <Input
              label="サーバー名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="マイサーバー"
              required
              error={fieldErrors.name}
              helperText="サーバーの表示名（50文字以内）"
            />

            {selectedEdition === 'java' ? (
              <>
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
                    helperText="1024-65535"
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
                    helperText="ゲームポートと異なる値"
                  />
                </div>

                <Input
                  label="RCONパスワード"
                  name="rconPassword"
                  type="password"
                  value={formData.rconPassword}
                  onChange={handleChange}
                  placeholder="8文字以上"
                  required
                  error={fieldErrors.rconPassword}
                  helperText="サーバー管理用パスワード（8文字以上）"
                />
              </>
            ) : (
              <Input
                label="ゲームポート (UDP)"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                min={1024}
                max={65535}
                required
                error={fieldErrors.port}
                helperText="統合版のデフォルトは19132"
              />
            )}

            {selectedEdition === 'java' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="サーバータイプ"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={javaServerTypes}
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
            ) : (
              <Input
                label="バージョン"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.21.50"
                required
                error={fieldErrors.version}
                helperText="統合版のバージョン（例: 1.21.50）"
              />
            )}

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
                helperText="1-100人"
              />
            </div>

            {/* プリセット選択 */}
            <div className="pt-4 border-t border-gray-700">
              <PresetSelector
                selectedPresetId={formData.presetId || 'balanced'}
                onSelect={handlePresetChange}
              />
            </div>

            {/* 詳細設定（Java版のみ） */}
            {selectedEdition === 'java' && (
              <AdvancedSettings
                settings={formData.advancedSettings || {}}
                baseSettings={currentPresetSettings}
                onChange={handleAdvancedSettingsChange}
              />
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

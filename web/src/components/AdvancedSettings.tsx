'use client';

import { useState } from 'react';
import type { PresetSettings } from '@/types';
import { Input } from './Input';
import { Select } from './Select';

interface AdvancedSettingsProps {
  settings: Partial<PresetSettings>;
  baseSettings: PresetSettings;
  onChange: (settings: Partial<PresetSettings>) => void;
}

export function AdvancedSettings({ settings, baseSettings, onChange }: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 現在の値を取得（カスタム設定があればそれを、なければプリセットのデフォルト）
  const getValue = <K extends keyof PresetSettings>(key: K): PresetSettings[K] => {
    return settings[key] !== undefined ? (settings[key] as PresetSettings[K]) : baseSettings[key];
  };

  // 値を更新
  const handleChange = <K extends keyof PresetSettings>(key: K, value: PresetSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  // boolean型の値を更新するヘルパー
  const handleBooleanChange = (key: keyof PresetSettings, checked: boolean) => {
    handleChange(key, checked as PresetSettings[typeof key]);
  };

  // number型の値を更新するヘルパー
  const handleNumberChange = (key: keyof PresetSettings, value: number) => {
    handleChange(key, value as PresetSettings[typeof key]);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors text-left"
      >
        <span className="font-medium text-gray-300">詳細設定</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 bg-gray-800/50 space-y-6">
          {/* JVM設定 */}
          <section>
            <h4 className="text-sm font-medium text-gray-300 mb-3">JVM設定</h4>
            <div className="space-y-3">
              <ToggleSwitch
                label="Aikar's Flags（GC最適化）"
                description="推奨: ON - ガベージコレクションを最適化します"
                checked={getValue('useAikarFlags')}
                onChange={(checked) => handleBooleanChange('useAikarFlags', checked)}
              />
            </div>
          </section>

          {/* パフォーマンス */}
          <section>
            <h4 className="text-sm font-medium text-gray-300 mb-3">パフォーマンス</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="描画距離"
                min={3}
                max={32}
                value={getValue('viewDistance')}
                onChange={(e) =>
                  handleNumberChange('viewDistance', parseInt(e.target.value, 10) || 10)
                }
                helperText="3-32 (推奨: 10、低スペック: 6-8)"
              />
              <Input
                type="number"
                label="シミュレーション距離"
                min={3}
                max={32}
                value={getValue('simulationDistance')}
                onChange={(e) =>
                  handleNumberChange('simulationDistance', parseInt(e.target.value, 10) || 10)
                }
                helperText="3-32 (描画距離以下を推奨)"
              />
            </div>
          </section>

          {/* ゲームプレイ */}
          <section>
            <h4 className="text-sm font-medium text-gray-300 mb-3">ゲームプレイ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label="難易度"
                value={getValue('difficulty')}
                onChange={(e) =>
                  handleChange('difficulty', e.target.value as PresetSettings['difficulty'])
                }
                options={[
                  { value: 'peaceful', label: 'ピースフル（モンスター無し）' },
                  { value: 'easy', label: 'イージー' },
                  { value: 'normal', label: 'ノーマル' },
                  { value: 'hard', label: 'ハード' },
                ]}
              />
              <Select
                label="ゲームモード"
                value={getValue('gamemode')}
                onChange={(e) =>
                  handleChange('gamemode', e.target.value as PresetSettings['gamemode'])
                }
                options={[
                  { value: 'survival', label: 'サバイバル' },
                  { value: 'creative', label: 'クリエイティブ' },
                  { value: 'adventure', label: 'アドベンチャー' },
                  { value: 'spectator', label: 'スペクテイター' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ToggleSwitch
                label="PvP"
                description="プレイヤー同士の戦闘"
                checked={getValue('pvp')}
                onChange={(checked) => handleBooleanChange('pvp', checked)}
              />
              <ToggleSwitch
                label="ハードコア"
                description="死亡時にスペクテイター"
                checked={getValue('hardcore')}
                onChange={(checked) => handleBooleanChange('hardcore', checked)}
              />
              <ToggleSwitch
                label="飛行許可"
                description="サバイバルでの飛行"
                checked={getValue('allowFlight')}
                onChange={(checked) => handleBooleanChange('allowFlight', checked)}
              />
              <ToggleSwitch
                label="ゲームモード強制"
                description="参加時にリセット"
                checked={getValue('forceGamemode')}
                onChange={(checked) => handleBooleanChange('forceGamemode', checked)}
              />
            </div>
          </section>

          {/* スポーン設定 */}
          <section>
            <h4 className="text-sm font-medium text-gray-300 mb-3">スポーン設定</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <ToggleSwitch
                label="モンスター出現"
                description="敵対的なMob"
                checked={getValue('spawnMonsters')}
                onChange={(checked) => handleBooleanChange('spawnMonsters', checked)}
              />
              <ToggleSwitch
                label="動物出現"
                description="受動的なMob"
                checked={getValue('spawnAnimals')}
                onChange={(checked) => handleBooleanChange('spawnAnimals', checked)}
              />
              <ToggleSwitch
                label="村人出現"
                description="NPC"
                checked={getValue('spawnNpcs')}
                onChange={(checked) => handleBooleanChange('spawnNpcs', checked)}
              />
            </div>
            <div className="max-w-xs">
              <Input
                type="number"
                label="スポーン保護範囲"
                min={0}
                max={100}
                value={getValue('spawnProtection')}
                onChange={(e) =>
                  handleNumberChange('spawnProtection', parseInt(e.target.value, 10) || 0)
                }
                helperText="0-100 (0で無効)"
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            w-10 h-6 rounded-full transition-colors
            ${checked ? 'bg-green-500' : 'bg-gray-600'}
            peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-800
          `}
        />
        <div
          className={`
            absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-200 group-hover:text-white">{label}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
      </div>
    </label>
  );
}

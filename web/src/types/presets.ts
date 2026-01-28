// プリセット設定の型定義

export interface PresetSettings {
  // JVM設定
  useAikarFlags: boolean;

  // パフォーマンス
  viewDistance: number;
  simulationDistance: number;

  // ゲームプレイ
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator';
  pvp: boolean;
  hardcore: boolean;
  allowFlight: boolean;
  forceGamemode: boolean;

  // スポーン設定
  spawnMonsters: boolean;
  spawnAnimals: boolean;
  spawnNpcs: boolean;
  spawnProtection: number;
}

export interface ServerPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommended?: boolean;
  settings: PresetSettings;
}

// デフォルトのプリセット設定
export const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  useAikarFlags: true,
  viewDistance: 10,
  simulationDistance: 10,
  difficulty: 'normal',
  gamemode: 'survival',
  pvp: true,
  hardcore: false,
  allowFlight: true,
  forceGamemode: false,
  spawnMonsters: true,
  spawnAnimals: true,
  spawnNpcs: true,
  spawnProtection: 16,
};

// サーバープリセット定義
export const SERVER_PRESETS: ServerPreset[] = [
  {
    id: 'balanced',
    name: 'バランス',
    description: '標準的なマルチプレイ設定',
    icon: 'balanced',
    recommended: true,
    settings: {
      ...DEFAULT_PRESET_SETTINGS,
    },
  },
  {
    id: 'lightweight',
    name: '軽量',
    description: '低スペック環境向け最適化',
    icon: 'lightweight',
    settings: {
      ...DEFAULT_PRESET_SETTINGS,
      viewDistance: 6,
      simulationDistance: 6,
    },
  },
  {
    id: 'creative',
    name: 'クリエイティブ',
    description: '建築・創作向け',
    icon: 'creative',
    settings: {
      ...DEFAULT_PRESET_SETTINGS,
      difficulty: 'peaceful',
      gamemode: 'creative',
      pvp: false,
      allowFlight: true,
      spawnMonsters: false,
    },
  },
  {
    id: 'hardcore',
    name: 'ハードコア',
    description: '上級者向けチャレンジ',
    icon: 'hardcore',
    settings: {
      ...DEFAULT_PRESET_SETTINGS,
      difficulty: 'hard',
      hardcore: true,
      pvp: true,
      forceGamemode: true,
    },
  },
  {
    id: 'friendly',
    name: 'フレンドリー',
    description: '初心者・お子様向け',
    icon: 'friendly',
    settings: {
      ...DEFAULT_PRESET_SETTINGS,
      difficulty: 'peaceful',
      pvp: false,
      spawnMonsters: false,
      spawnProtection: 32,
    },
  },
];

// プリセットIDからプリセットを取得
export function getPresetById(id: string): ServerPreset | undefined {
  return SERVER_PRESETS.find((preset) => preset.id === id);
}

// プリセット設定をマージ（プリセット + カスタマイズ）
export function mergePresetSettings(
  presetId: string,
  customSettings?: Partial<PresetSettings>
): PresetSettings {
  const preset = getPresetById(presetId);
  const baseSettings = preset?.settings ?? DEFAULT_PRESET_SETTINGS;

  if (!customSettings) {
    return { ...baseSettings };
  }

  return {
    ...baseSettings,
    ...customSettings,
  };
}

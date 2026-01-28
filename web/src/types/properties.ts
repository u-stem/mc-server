// サーバー設定プロパティの定義
export interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  min?: number;
  max?: number;
}

export interface PropertyCategoryDefinition {
  label: string;
  properties: PropertyDefinition[];
}

// 設定カテゴリの定義
export const PROPERTY_CATEGORIES: Record<string, PropertyCategoryDefinition> = {
  gameplay: {
    label: 'ゲームプレイ',
    properties: [
      {
        key: 'difficulty',
        label: '難易度',
        type: 'select',
        options: ['peaceful', 'easy', 'normal', 'hard'],
      },
      {
        key: 'gamemode',
        label: 'ゲームモード',
        type: 'select',
        options: ['survival', 'creative', 'adventure', 'spectator'],
      },
      { key: 'hardcore', label: 'ハードコア', type: 'boolean' },
      { key: 'pvp', label: 'PvP', type: 'boolean' },
      { key: 'allow-flight', label: '飛行許可', type: 'boolean' },
      { key: 'force-gamemode', label: 'ゲームモード強制', type: 'boolean' },
    ],
  },
  spawn: {
    label: 'スポーン設定',
    properties: [
      { key: 'spawn-monsters', label: 'モンスター出現', type: 'boolean' },
      { key: 'spawn-animals', label: '動物出現', type: 'boolean' },
      { key: 'spawn-npcs', label: '村人出現', type: 'boolean' },
      { key: 'spawn-protection', label: 'スポーン保護範囲', type: 'number', min: 0, max: 100 },
    ],
  },
  world: {
    label: 'ワールド',
    properties: [
      { key: 'level-name', label: 'ワールド名', type: 'text' },
      { key: 'level-seed', label: 'シード値', type: 'text' },
      {
        key: 'level-type',
        label: 'ワールドタイプ',
        type: 'select',
        options: [
          'minecraft:normal',
          'minecraft:flat',
          'minecraft:large_biomes',
          'minecraft:amplified',
          'minecraft:single_biome_surface',
        ],
      },
      { key: 'generate-structures', label: '構造物生成', type: 'boolean' },
      { key: 'max-world-size', label: '最大ワールドサイズ', type: 'number', min: 1, max: 29999984 },
    ],
  },
  server: {
    label: 'サーバー',
    properties: [
      { key: 'max-players', label: '最大プレイヤー数', type: 'number', min: 1, max: 100 },
      { key: 'motd', label: 'サーバー説明', type: 'text' },
      { key: 'online-mode', label: 'オンラインモード', type: 'boolean' },
      { key: 'white-list', label: 'ホワイトリスト有効', type: 'boolean' },
      { key: 'enforce-whitelist', label: 'ホワイトリスト強制', type: 'boolean' },
      {
        key: 'player-idle-timeout',
        label: 'アイドルタイムアウト（分）',
        type: 'number',
        min: 0,
        max: 60,
      },
    ],
  },
  performance: {
    label: 'パフォーマンス',
    properties: [
      { key: 'view-distance', label: '描画距離', type: 'number', min: 3, max: 32 },
      {
        key: 'simulation-distance',
        label: 'シミュレーション距離',
        type: 'number',
        min: 3,
        max: 32,
      },
      { key: 'max-tick-time', label: '最大Tick時間（ms）', type: 'number', min: -1, max: 60000 },
      {
        key: 'network-compression-threshold',
        label: 'ネットワーク圧縮閾値',
        type: 'number',
        min: -1,
        max: 65535,
      },
      { key: 'sync-chunk-writes', label: '同期チャンク書き込み', type: 'boolean' },
    ],
  },
  other: {
    label: 'その他',
    properties: [{ key: 'enable-command-block', label: 'コマンドブロック有効', type: 'boolean' }],
  },
};

export type PropertyCategory = keyof typeof PROPERTY_CATEGORIES;

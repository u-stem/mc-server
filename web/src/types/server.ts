import type { PresetSettings } from './presets';

// サーバーエディション
export type ServerEdition = 'java' | 'bedrock';

// サーバータイプ
// MOD系: FABRIC, FORGE, NEOFORGE, QUILT
// プラグイン系: VANILLA, SPIGOT, PAPER, PURPUR, FOLIA
// ハイブリッド系（MOD+プラグイン）: MOHIST, ARCLIGHT, CATSERVER
// 統合版: BEDROCK
export type ServerType =
  | 'FABRIC'
  | 'FORGE'
  | 'NEOFORGE'
  | 'QUILT'
  | 'VANILLA'
  | 'SPIGOT'
  | 'PAPER'
  | 'PURPUR'
  | 'FOLIA'
  | 'MOHIST'
  | 'ARCLIGHT'
  | 'CATSERVER'
  | 'BEDROCK';

// MODをサポートするサーバータイプ
export const MOD_SERVER_TYPES: ServerType[] = [
  'FABRIC',
  'FORGE',
  'NEOFORGE',
  'QUILT',
  'MOHIST',
  'ARCLIGHT',
  'CATSERVER',
];

// プラグインをサポートするサーバータイプ
export const PLUGIN_SERVER_TYPES: ServerType[] = [
  'SPIGOT',
  'PAPER',
  'PURPUR',
  'FOLIA',
  'MOHIST',
  'ARCLIGHT',
  'CATSERVER',
];

// Bedrock（統合版）サーバータイプ
export const BEDROCK_SERVER_TYPES: ServerType[] = ['BEDROCK'];

// TPSコマンドをサポートするサーバータイプ（Bukkit/Spigot系）
export const TPS_SUPPORTED_SERVER_TYPES: ServerType[] = [
  'SPIGOT',
  'PAPER',
  'PURPUR',
  'FOLIA',
  'MOHIST',
  'ARCLIGHT',
  'CATSERVER',
];

// MODサーバーかどうかを判定
export function isModServer(type: ServerType): boolean {
  return MOD_SERVER_TYPES.includes(type);
}

// プラグインサーバーかどうかを判定
export function isPluginServer(type: ServerType): boolean {
  return PLUGIN_SERVER_TYPES.includes(type);
}

// Bedrockサーバーかどうかを判定
export function isBedrockServer(type: ServerType): boolean {
  return BEDROCK_SERVER_TYPES.includes(type);
}

// TPSコマンドをサポートするサーバーかどうかを判定
export function supportsTps(type: ServerType): boolean {
  return TPS_SUPPORTED_SERVER_TYPES.includes(type);
}

// サーバー設定
export interface ServerConfig {
  id: string;
  name: string;
  port: number;
  rconPort: number;
  rconPassword: string;
  version: string;
  type: ServerType;
  memory: string;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  // プリセット設定
  presetId?: string;
  advancedSettings?: Partial<PresetSettings>;
  // エディション（後方互換性のためオプショナル、未指定は java として扱う）
  edition?: ServerEdition;
  // GeyserMC用ポート（統合版プレイヤーの接続用）
  geyserPort?: number;
}

// TPS情報（1分、5分、15分の平均）
export interface TpsInfo {
  tps1m: number;
  tps5m: number;
  tps15m: number;
}

// サーバーステータス
export interface ServerStatus {
  running: boolean;
  players: {
    online: number;
    max: number;
    list: string[];
  };
  uptime?: string;
  memory?: {
    used: string;
    total: string;
  };
  cpu?: string;
  tps?: TpsInfo;
}

// サーバー詳細（設定 + ステータス）
export interface ServerDetails extends ServerConfig {
  status: ServerStatus;
}

// サーバー作成リクエスト
export interface CreateServerRequest {
  name: string;
  port: number;
  rconPort: number;
  rconPassword: string;
  version: string;
  type: ServerType;
  memory: string;
  maxPlayers: number;
  // 新規フィールド
  presetId?: string;
  advancedSettings?: Partial<PresetSettings>;
  // エディション（後方互換性のためオプショナル）
  edition?: ServerEdition;
  // GeyserMC用ポート
  geyserPort?: number;
}

// 設定ファイル全体
export interface ServersConfigFile {
  servers: ServerConfig[];
  defaultServerId?: string;
}

// ホワイトリストエントリ
export interface WhitelistEntry {
  uuid: string;
  name: string;
}

// バックアップ情報
export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  DEFAULT_PASSWORD_LENGTH,
  DEFAULT_SERVER_ID,
  MAX_PLAYERS_MAX,
  MAX_PLAYERS_MIN,
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
  PORT_MAX,
  PORT_MIN,
  SERVER_NAME_MAX_LENGTH,
  SPAWN_PROTECTION_MAX,
  SPAWN_PROTECTION_MIN,
  VIEW_DISTANCE_MAX,
  VIEW_DISTANCE_MIN,
} from './constants';
import { ERROR_INVALID_SERVER_ID } from './errorMessages';

// UUID v4 の正規表現
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// プレイヤー名の正規表現
const PLAYER_NAME_REGEX = new RegExp(
  `^[a-zA-Z0-9_]{${PLAYER_NAME_MIN_LENGTH},${PLAYER_NAME_MAX_LENGTH}}$`
);

// サーバーID のバリデーション（'default' または UUID v4）
export function isValidServerId(id: string): boolean {
  return id === DEFAULT_SERVER_ID || UUID_REGEX.test(id);
}

// サーバーID を検証して返す（無効な場合はエラー）
export function validateServerId(id: string): string {
  if (!isValidServerId(id)) {
    throw new Error(ERROR_INVALID_SERVER_ID);
  }
  return id;
}

// Minecraft プレイヤー名のバリデーション
export function isValidPlayerName(name: string): boolean {
  return PLAYER_NAME_REGEX.test(name);
}

// ポート番号のバリデーション
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= PORT_MIN && port <= PORT_MAX;
}

// 安全なファイル名のバリデーション（パストラバーサル防止）
export function isValidFileName(name: string): boolean {
  // パストラバーサル文字を含まない、英数字・ハイフン・アンダースコア・ドットのみ
  return /^[a-zA-Z0-9_\-.]+$/.test(name) && !name.includes('..');
}

// Zod スキーマ定義

export const ServerIdSchema = z.string().refine(isValidServerId, {
  message: 'サーバーIDはUUID形式または"default"である必要があります',
});

export const PlayerNameSchema = z.string().refine(isValidPlayerName, {
  message: 'プレイヤー名は3-16文字の英数字とアンダースコアのみ使用できます',
});

export const PortSchema = z.number().int().min(PORT_MIN).max(PORT_MAX);

export const ServerTypeSchema = z.enum([
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
  'BEDROCK',
]);

export const ServerEditionSchema = z.enum(['java', 'bedrock']);

export const MemorySchema = z.string().regex(/^\d+[GM]$/, {
  message: 'メモリは "4G" や "512M" の形式で指定してください',
});

// プリセットID
export const PresetIdSchema = z.enum([
  'balanced',
  'lightweight',
  'creative',
  'hardcore',
  'friendly',
]);

// 詳細設定のスキーマ
export const AdvancedSettingsSchema = z
  .object({
    // JVM設定
    useAikarFlags: z.boolean().optional(),

    // パフォーマンス
    viewDistance: z.number().int().min(VIEW_DISTANCE_MIN).max(VIEW_DISTANCE_MAX).optional(),
    simulationDistance: z.number().int().min(VIEW_DISTANCE_MIN).max(VIEW_DISTANCE_MAX).optional(),

    // ゲームプレイ
    difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).optional(),
    gamemode: z.enum(['survival', 'creative', 'adventure', 'spectator']).optional(),
    pvp: z.boolean().optional(),
    hardcore: z.boolean().optional(),
    allowFlight: z.boolean().optional(),
    forceGamemode: z.boolean().optional(),

    // スポーン設定
    spawnMonsters: z.boolean().optional(),
    spawnAnimals: z.boolean().optional(),
    spawnNpcs: z.boolean().optional(),
    spawnProtection: z
      .number()
      .int()
      .min(SPAWN_PROTECTION_MIN)
      .max(SPAWN_PROTECTION_MAX)
      .optional(),
  })
  .optional();

export const CreateServerSchema = z.object({
  name: z
    .string()
    .min(1, 'サーバー名は必須です')
    .max(SERVER_NAME_MAX_LENGTH, `サーバー名は${SERVER_NAME_MAX_LENGTH}文字以内です`),
  port: PortSchema,
  rconPort: PortSchema.optional(),
  rconPassword: z.string().min(1).optional(),
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, {
    message: 'バージョンは "1.21.1" の形式で指定してください',
  }),
  type: ServerTypeSchema,
  memory: MemorySchema,
  maxPlayers: z.number().int().min(MAX_PLAYERS_MIN).max(MAX_PLAYERS_MAX),
  // プリセット設定
  presetId: PresetIdSchema.optional(),
  advancedSettings: AdvancedSettingsSchema,
  // エディション
  edition: ServerEditionSchema.optional(),
  // GeyserMC用ポート
  geyserPort: PortSchema.optional(),
});

export const AddPlayerSchema = z.object({
  name: PlayerNameSchema,
});

// ランダムなパスワードを生成（暗号学的に安全）
export function generateRandomPassword(length: number = DEFAULT_PASSWORD_LENGTH): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(bytes[i] % chars.length);
  }
  return password;
}

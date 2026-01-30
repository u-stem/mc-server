import { Rcon } from 'rcon-client';
import type { TpsInfo, WhitelistEntry } from '@/types';
import { getServer } from './config';
import { MESSAGE_MAX_LENGTH, REASON_MAX_LENGTH, TIMEOUT_RCON_MS } from './constants';
import { getServerStatus } from './docker';
import {
  createCommandNotAllowedError,
  createRconCommandFailedError,
  ERROR_COMMAND_IS_EMPTY,
  ERROR_INVALID_PLAYER_NAME_FORMAT,
  ERROR_MESSAGE_EMPTY_OR_INVALID,
  ERROR_SERVER_NOT_FOUND,
  ERROR_WHITELIST_FILE_NOT_FOUND,
} from './errorMessages';
import { isValidPlayerName, validateServerId } from './validation';

// RCON設定
const RCON_HOST = 'localhost';

// RCON 接続を作成
async function createRconConnection(serverId: string): Promise<Rcon> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const server = await getServer(serverId);

  if (!server) {
    throw new Error(ERROR_SERVER_NOT_FOUND);
  }

  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: server.rconPort,
    password: server.rconPassword,
    timeout: TIMEOUT_RCON_MS,
  });

  return rcon;
}

// サーバーが起動中かチェック
async function isServerRunning(serverId: string): Promise<boolean> {
  try {
    const status = await getServerStatus(serverId);
    return status.running;
  } catch {
    return false;
  }
}

// RCON コマンドを実行（内部用、外部には公開しない）
async function executeCommand(serverId: string, command: string): Promise<string> {
  const rcon = await createRconConnection(serverId);

  try {
    const response = await rcon.send(command);
    return response;
  } finally {
    await rcon.end();
  }
}

// ホワイトリスト取得
export async function getWhitelist(serverId: string): Promise<WhitelistEntry[]> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  const server = await getServer(serverId);

  if (!server) {
    throw new Error(ERROR_SERVER_NOT_FOUND);
  }

  // whitelist.json を直接読む方が確実
  const { promises: fs } = await import('node:fs');
  const { getServerDataPath } = await import('./config');

  const dataPath = getServerDataPath(serverId);
  const whitelistPath = `${dataPath}/whitelist.json`;

  try {
    const content = await fs.readFile(whitelistPath, 'utf-8');
    const whitelist = JSON.parse(content) as WhitelistEntry[];
    return whitelist;
  } catch {
    // ファイルが存在しない場合は空配列
    return [];
  }
}

// ホワイトリストにプレイヤーを追加
export async function addToWhitelist(serverId: string, playerName: string): Promise<string> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // プレイヤー名をバリデーション
  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  const running = await isServerRunning(serverId);

  if (running) {
    // サーバー起動中はRCONを使用（失敗時はエラーを返す）
    try {
      const response = await executeCommand(serverId, `whitelist add ${playerName}`);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(createRconCommandFailedError(message));
    }
  }

  // サーバー停止中はファイルを直接編集
  const { promises: fs } = await import('node:fs');
  const { getServerDataPath } = await import('./config');

  const dataPath = getServerDataPath(serverId);
  const whitelistPath = `${dataPath}/whitelist.json`;

  let whitelist: WhitelistEntry[] = [];

  try {
    const content = await fs.readFile(whitelistPath, 'utf-8');
    whitelist = JSON.parse(content);
  } catch {
    // ファイルが存在しない場合
  }

  // 既に存在するかチェック
  if (whitelist.some((entry) => entry.name.toLowerCase() === playerName.toLowerCase())) {
    return `Player ${playerName} is already whitelisted`;
  }

  // オフラインモード用のUUIDを生成（Minecraft互換形式）
  // "OfflinePlayer:" + playerName のMD5ハッシュをUUID v3形式で生成
  const { createHash } = await import('node:crypto');
  const hash = createHash('md5').update(`OfflinePlayer:${playerName}`).digest('hex');
  const offlineUuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;

  whitelist.push({
    uuid: offlineUuid,
    name: playerName,
  });

  await fs.writeFile(whitelistPath, JSON.stringify(whitelist, null, 2));

  return `Added ${playerName} to whitelist`;
}

// ホワイトリストからプレイヤーを削除
export async function removeFromWhitelist(serverId: string, playerName: string): Promise<string> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // プレイヤー名をバリデーション
  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  const running = await isServerRunning(serverId);

  if (running) {
    // サーバー起動中はRCONを使用（失敗時はエラーを返す）
    try {
      const response = await executeCommand(serverId, `whitelist remove ${playerName}`);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(createRconCommandFailedError(message));
    }
  }

  // サーバー停止中はファイルを直接編集
  const { promises: fs } = await import('node:fs');
  const { getServerDataPath } = await import('./config');

  const dataPath = getServerDataPath(serverId);
  const whitelistPath = `${dataPath}/whitelist.json`;

  let whitelist: WhitelistEntry[] = [];

  try {
    const content = await fs.readFile(whitelistPath, 'utf-8');
    whitelist = JSON.parse(content);
  } catch {
    return ERROR_WHITELIST_FILE_NOT_FOUND;
  }

  const index = whitelist.findIndex(
    (entry) => entry.name.toLowerCase() === playerName.toLowerCase()
  );

  if (index === -1) {
    return `Player ${playerName} is not whitelisted`;
  }

  whitelist.splice(index, 1);
  await fs.writeFile(whitelistPath, JSON.stringify(whitelist, null, 2));

  return `Removed ${playerName} from whitelist`;
}

// プレイヤー一覧取得
export async function getOnlinePlayers(
  serverId: string
): Promise<{ online: number; max: number; list: string[] }> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  try {
    const response = await executeCommand(serverId, 'list');
    // 例: "There are 2 of a max of 10 players online: Player1, Player2"
    const match = response.match(/There are (\d+) of a max of (\d+) players online:?\s*(.*)?/i);

    if (match) {
      const online = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      const list = match[3]
        ? match[3]
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
        : [];

      return { online, max, list };
    }

    return { online: 0, max: 0, list: [] };
  } catch {
    return { online: 0, max: 0, list: [] };
  }
}

// サーバーにメッセージを送信（危険なコマンドを防止）
export async function sendMessage(serverId: string, message: string): Promise<string> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // メッセージをサニタイズ（特殊文字を除去）
  // Minecraftのsayコマンドで危険な文字を含まないようにする
  const sanitizedMessage = message
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF。、！？]/g, '') // 英数字、空白、日本語のみ許可
    .slice(0, MESSAGE_MAX_LENGTH);

  if (!sanitizedMessage) {
    throw new Error(ERROR_MESSAGE_EMPTY_OR_INVALID);
  }

  return executeCommand(serverId, `say ${sanitizedMessage}`);
}

// 許可されたコマンドのリスト
const ALLOWED_COMMANDS = [
  'list',
  'tps',
  'whitelist',
  'ban',
  'ban-ip',
  'pardon',
  'pardon-ip',
  'kick',
  'op',
  'deop',
  'gamemode',
  'difficulty',
  'time',
  'weather',
  'say',
  'tell',
  'tp',
  'give',
  'effect',
  'seed',
  'gamerule',
] as const;

// コンソールコマンドを実行（許可リストで制限）
export async function executeConsoleCommand(serverId: string, command: string): Promise<string> {
  // サーバーIDをバリデーション
  validateServerId(serverId);

  // コマンドをトリム
  const trimmedCommand = command.trim();
  if (!trimmedCommand) {
    throw new Error(ERROR_COMMAND_IS_EMPTY);
  }

  // コマンドの先頭部分を取得（/ があれば除去）
  const commandWithoutSlash = trimmedCommand.startsWith('/')
    ? trimmedCommand.slice(1)
    : trimmedCommand;
  const baseCommand = commandWithoutSlash.split(/\s+/)[0].toLowerCase();

  // 許可リストをチェック
  if (!ALLOWED_COMMANDS.includes(baseCommand as (typeof ALLOWED_COMMANDS)[number])) {
    throw new Error(createCommandNotAllowedError(baseCommand, ALLOWED_COMMANDS));
  }

  return executeCommand(serverId, commandWithoutSlash);
}

// プレイヤーをBan
export async function banPlayer(
  serverId: string,
  playerName: string,
  reason?: string
): Promise<string> {
  validateServerId(serverId);

  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  const command = reason
    ? `ban ${playerName} ${reason.slice(0, REASON_MAX_LENGTH)}`
    : `ban ${playerName}`;

  return executeCommand(serverId, command);
}

// プレイヤーのBanを解除
export async function pardonPlayer(serverId: string, playerName: string): Promise<string> {
  validateServerId(serverId);

  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  return executeCommand(serverId, `pardon ${playerName}`);
}

// プレイヤーをKick
export async function kickPlayer(
  serverId: string,
  playerName: string,
  reason?: string
): Promise<string> {
  validateServerId(serverId);

  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  const command = reason
    ? `kick ${playerName} ${reason.slice(0, REASON_MAX_LENGTH)}`
    : `kick ${playerName}`;

  return executeCommand(serverId, command);
}

// プレイヤーにOP権限を付与
export async function opPlayer(serverId: string, playerName: string): Promise<string> {
  validateServerId(serverId);

  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  return executeCommand(serverId, `op ${playerName}`);
}

// プレイヤーのOP権限を剥奪
export async function deopPlayer(serverId: string, playerName: string): Promise<string> {
  validateServerId(serverId);

  if (!isValidPlayerName(playerName)) {
    throw new Error(ERROR_INVALID_PLAYER_NAME_FORMAT);
  }

  return executeCommand(serverId, `deop ${playerName}`);
}

// TPS取得（Paper/Spigot系のみ）
export async function getTps(serverId: string): Promise<TpsInfo | null> {
  validateServerId(serverId);

  try {
    const response = await executeCommand(serverId, 'tps');

    // Paper/Spigot形式: "§6TPS from last 1m, 5m, 15m: §a20.0§r, §a20.0§r, §a20.0"
    // Minecraft色コード（§x）を除去
    const cleanResponse = response.replace(/§[0-9a-fk-or]/gi, '');

    // TPS値を抽出（カンマ区切り、スペースあり）
    const tpsMatch = cleanResponse.match(
      /TPS from last 1m, 5m, 15m:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    );

    if (tpsMatch) {
      const tps1m = parseFloat(tpsMatch[1]);
      const tps5m = parseFloat(tpsMatch[2]);
      const tps15m = parseFloat(tpsMatch[3]);

      if (!Number.isNaN(tps1m) && !Number.isNaN(tps5m) && !Number.isNaN(tps15m)) {
        return { tps1m, tps5m, tps15m };
      }
    }

    // Paper 1.20+形式: "TPS from last 5s, 1m, 5m, 15m: 20.0, 20.0, 20.0, 20.0"
    const newTpsMatch = cleanResponse.match(
      /TPS from last 5s, 1m, 5m, 15m:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    );

    if (newTpsMatch) {
      // 5s, 1m, 5m, 15m の順なので、インデックス2, 3, 4を使用
      const tps1m = parseFloat(newTpsMatch[2]);
      const tps5m = parseFloat(newTpsMatch[3]);
      const tps15m = parseFloat(newTpsMatch[4]);

      if (!Number.isNaN(tps1m) && !Number.isNaN(tps5m) && !Number.isNaN(tps15m)) {
        return { tps1m, tps5m, tps15m };
      }
    }

    console.warn('[TPS] Failed to parse response:', response, '-> cleaned:', cleanResponse);
    return null;
  } catch (error) {
    console.error('[TPS] Error getting TPS:', error);
    return null;
  }
}

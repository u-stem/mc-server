import { promises as fs } from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { CreateServerRequest, PresetSettings, ServerConfig, ServersConfigFile } from '@/types';
import { isBedrockServer, mergePresetSettings } from '@/types';
import {
  BYTES_PER_KB,
  DEFAULT_BEDROCK_PORT,
  DEFAULT_JAVA_PORT,
  DEFAULT_LEVEL_NAME,
  DEFAULT_MEMORY,
  DEFAULT_PRESET_ID,
  DEFAULT_RCON_PORT,
  DEFAULT_SERVER_ID,
  DEFAULT_SERVER_TYPE,
  DEFAULT_VERSION,
  FOLDER_BACKUPS,
  FOLDER_DATA,
} from './constants';
import { applyOptimizations } from './optimization';

// プロジェクトルートパス（環境変数で上書き可能）
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(process.cwd(), '..');
const SERVERS_DIR = path.join(PROJECT_ROOT, 'servers');
const CONFIG_FILE = path.join(SERVERS_DIR, 'config.json');

// ホスト側のパス（Dockerコンテナ内から実行する場合に使用）
// Docker内から docker compose を実行する際、ボリュームパスはホスト側のパスが必要
const HOST_PROJECT_ROOT = process.env.HOST_PROJECT_ROOT || PROJECT_ROOT;
const HOST_SERVERS_DIR = path.join(HOST_PROJECT_ROOT, 'servers');

// 既存の docker-compose.yml からデフォルトサーバーを読み込む
async function getDefaultServerFromLegacy(): Promise<ServerConfig | null> {
  const legacyComposePath = path.join(PROJECT_ROOT, 'docker-compose.yml');

  try {
    await fs.access(legacyComposePath);

    // 既存の構成がある場合、デフォルトサーバーとして認識
    return {
      id: DEFAULT_SERVER_ID,
      name: 'Default Server',
      port: DEFAULT_JAVA_PORT,
      rconPort: DEFAULT_RCON_PORT,
      rconPassword: 'minecraft',
      version: DEFAULT_VERSION,
      type: DEFAULT_SERVER_TYPE,
      memory: DEFAULT_MEMORY,
      maxPlayers: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// 設定ファイルを読み込む
export async function loadConfig(): Promise<ServersConfigFile> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as ServersConfigFile;
  } catch {
    // config.json が存在しない場合、既存構成を確認
    const legacyServer = await getDefaultServerFromLegacy();

    if (legacyServer) {
      return {
        servers: [legacyServer],
        defaultServerId: DEFAULT_SERVER_ID,
      };
    }

    return { servers: [] };
  }
}

// 設定ファイルを保存
export async function saveConfig(config: ServersConfigFile): Promise<void> {
  await fs.mkdir(SERVERS_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 全サーバー取得
export async function getAllServers(): Promise<ServerConfig[]> {
  const config = await loadConfig();
  return config.servers;
}

// サーバー取得（ID指定）
export async function getServer(id: string): Promise<ServerConfig | null> {
  const config = await loadConfig();
  return config.servers.find((s) => s.id === id) || null;
}

// ポートが他のサーバーで使用されているかチェック
export async function isPortInUse(port: number, excludeServerId?: string): Promise<boolean> {
  const config = await loadConfig();
  return config.servers.some(
    (s) =>
      s.id !== excludeServerId && (s.port === port || s.rconPort === port || s.geyserPort === port)
  );
}

// サーバー作成
export async function createServer(request: CreateServerRequest): Promise<ServerConfig> {
  const config = await loadConfig();

  // ポート重複チェック
  const gamePortInUse = await isPortInUse(request.port);
  if (gamePortInUse) {
    throw new Error(`Port ${request.port} is already in use by another server`);
  }

  // BedrockサーバーはRCONがないため、RCONポートのチェックをスキップ
  const isBedrock = isBedrockServer(request.type);

  if (!isBedrock && request.rconPort) {
    const rconPortInUse = await isPortInUse(request.rconPort);
    if (rconPortInUse) {
      throw new Error(`RCON port ${request.rconPort} is already in use by another server`);
    }

    // 同じポートを使用していないかチェック
    if (request.port === request.rconPort) {
      throw new Error('Game port and RCON port must be different');
    }
  }

  // GeyserMCポートのチェック
  if (request.geyserPort) {
    const geyserPortInUse = await isPortInUse(request.geyserPort);
    if (geyserPortInUse) {
      throw new Error(`GeyserMC port ${request.geyserPort} is already in use by another server`);
    }
    if (request.geyserPort === request.port || request.geyserPort === request.rconPort) {
      throw new Error('GeyserMC port must be different from game port and RCON port');
    }
  }

  const newServer: ServerConfig = {
    ...request,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  config.servers.push(newServer);
  await saveConfig(config);

  // サーバーディレクトリを作成
  const serverDir = path.join(SERVERS_DIR, newServer.id);
  await fs.mkdir(path.join(serverDir, FOLDER_DATA), { recursive: true });
  await fs.mkdir(path.join(serverDir, FOLDER_BACKUPS), { recursive: true });

  // docker-compose.yml を生成
  await generateDockerCompose(newServer);

  // サーバータイプに応じた最適化設定を適用
  const dataPath = path.join(serverDir, FOLDER_DATA);
  await applyOptimizations(newServer, dataPath);

  return newServer;
}

// サーバー更新
export async function updateServer(
  id: string,
  updates: Partial<CreateServerRequest>
): Promise<ServerConfig | null> {
  const config = await loadConfig();
  const index = config.servers.findIndex((s) => s.id === id);

  if (index === -1) {
    return null;
  }

  // ポート更新時は重複チェック
  if (updates.port !== undefined) {
    const gamePortInUse = await isPortInUse(updates.port, id);
    if (gamePortInUse) {
      throw new Error(`Port ${updates.port} is already in use by another server`);
    }
  }

  if (updates.rconPort !== undefined) {
    const rconPortInUse = await isPortInUse(updates.rconPort, id);
    if (rconPortInUse) {
      throw new Error(`RCON port ${updates.rconPort} is already in use by another server`);
    }
  }

  // 更新後のポートが同じになっていないかチェック
  const newPort = updates.port ?? config.servers[index].port;
  const newRconPort = updates.rconPort ?? config.servers[index].rconPort;
  if (newPort === newRconPort) {
    throw new Error('Game port and RCON port must be different');
  }

  config.servers[index] = {
    ...config.servers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveConfig(config);
  await generateDockerCompose(config.servers[index]);

  return config.servers[index];
}

// サーバー削除
export async function deleteServer(id: string): Promise<boolean> {
  const config = await loadConfig();
  const index = config.servers.findIndex((s) => s.id === id);

  if (index === -1) {
    return false;
  }

  config.servers.splice(index, 1);
  await saveConfig(config);

  // サーバーディレクトリを削除（オプション）
  // const serverDir = path.join(SERVERS_DIR, id);
  // await fs.rm(serverDir, { recursive: true, force: true });

  return true;
}

// メモリ設定をパースしてGB単位の数値を取得
export function parseMemoryToGB(memory: string): number {
  const value = parseInt(memory, 10);
  const unit = memory.slice(-1).toUpperCase();
  if (unit === 'G') {
    return value;
  } else if (unit === 'M') {
    return Math.ceil(value / BYTES_PER_KB);
  }
  return value;
}

// docker-compose.yml を生成
async function generateDockerCompose(server: ServerConfig): Promise<void> {
  const serverDir = path.join(SERVERS_DIR, server.id);
  const hostServerDir = path.join(HOST_SERVERS_DIR, server.id);
  await fs.mkdir(serverDir, { recursive: true });

  // Bedrockサーバーの場合は別テンプレートを使用
  if (isBedrockServer(server.type)) {
    const composeContent = generateBedrockDockerCompose(server, hostServerDir);
    await fs.writeFile(path.join(serverDir, 'docker-compose.yml'), composeContent);
    return;
  }

  // Java版サーバーの場合
  const composeContent = generateJavaDockerCompose(server, hostServerDir);
  await fs.writeFile(path.join(serverDir, 'docker-compose.yml'), composeContent);
}

// Bedrock版 docker-compose.yml を生成
function generateBedrockDockerCompose(server: ServerConfig, hostServerDir: string): string {
  // プリセット設定を取得（ゲームプレイ設定のみ使用）
  const presetId = server.presetId ?? DEFAULT_PRESET_ID;
  const settings: PresetSettings = mergePresetSettings(presetId, server.advancedSettings);

  return `services:
  minecraft:
    image: itzg/minecraft-bedrock-server
    container_name: mc-${server.id}
    stdin_open: true
    tty: true
    ports:
      - "${server.port}:${DEFAULT_BEDROCK_PORT}/udp"
    environment:
      EULA: "TRUE"
      SERVER_NAME: "${server.name}"
      GAMEMODE: ${settings.gamemode}
      DIFFICULTY: ${settings.difficulty}
      MAX_PLAYERS: ${server.maxPlayers}
      VIEW_DISTANCE: ${settings.viewDistance}
      LEVEL_NAME: "${DEFAULT_LEVEL_NAME}"
      TZ: Asia/Tokyo
    volumes:
      - ${hostServerDir}/data:/data
    restart: unless-stopped
`;
}

// Java版 docker-compose.yml を生成
function generateJavaDockerCompose(server: ServerConfig, hostServerDir: string): string {
  // プリセット設定をマージ
  const presetId = server.presetId ?? DEFAULT_PRESET_ID;
  const settings: PresetSettings = mergePresetSettings(presetId, server.advancedSettings);

  // コンテナメモリ制限を計算（JVMヒープ + 2GB余裕）
  const jvmHeapGB = parseMemoryToGB(server.memory);
  const containerMemoryLimit = `${jvmHeapGB + 2}G`;

  // ブール値を文字列に変換
  const boolToStr = (val: boolean): string => (val ? 'true' : 'false');

  // ポート設定
  const ports = [
    `"${server.port}:${DEFAULT_JAVA_PORT}"`,
    `"${server.rconPort}:${DEFAULT_RCON_PORT}"`,
  ];

  // GeyserMC用ポートがある場合は追加（UDP）
  if (server.geyserPort) {
    ports.push(`"${server.geyserPort}:${DEFAULT_BEDROCK_PORT}/udp"`);
  }

  const portsYaml = ports.map((p) => `      - ${p}`).join('\n');

  return `services:
  minecraft:
    image: itzg/minecraft-server
    container_name: mc-${server.id}
    ports:
${portsYaml}
    environment:
      EULA: "TRUE"
      TYPE: ${server.type}
      VERSION: "${server.version}"

      # メモリ設定（init = max でヒープリサイズを防止）
      INIT_MEMORY: ${server.memory}
      MAX_MEMORY: ${server.memory}

      # JVM最適化（Aikar's flags）
      USE_AIKAR_FLAGS: "${boolToStr(settings.useAikarFlags)}"

      # サーバー設定
      MAX_PLAYERS: ${server.maxPlayers}
      MOTD: "${server.name}"
      DIFFICULTY: ${settings.difficulty}
      MODE: ${settings.gamemode}
      PVP: "${boolToStr(settings.pvp)}"
      HARDCORE: "${boolToStr(settings.hardcore)}"
      ALLOW_FLIGHT: "${boolToStr(settings.allowFlight)}"
      FORCE_GAMEMODE: "${boolToStr(settings.forceGamemode)}"

      # スポーン設定
      SPAWN_MONSTERS: "${boolToStr(settings.spawnMonsters)}"
      SPAWN_ANIMALS: "${boolToStr(settings.spawnAnimals)}"
      SPAWN_NPCS: "${boolToStr(settings.spawnNpcs)}"
      SPAWN_PROTECTION: ${settings.spawnProtection}

      # セキュリティ
      ONLINE_MODE: "TRUE"
      ENABLE_WHITELIST: "TRUE"
      ENFORCE_WHITELIST: "TRUE"

      # パフォーマンス
      VIEW_DISTANCE: ${settings.viewDistance}
      SIMULATION_DISTANCE: ${settings.simulationDistance}

      # RCON
      ENABLE_RCON: "true"
      RCON_PASSWORD: "${server.rconPassword}"

      TZ: Asia/Tokyo
    volumes:
      - ${hostServerDir}/data:/data
    restart: unless-stopped
    stdin_open: true
    tty: true

    # リソース制限
    deploy:
      resources:
        limits:
          memory: ${containerMemoryLimit}
        reservations:
          memory: ${server.memory}

    # ヘルスチェック
    healthcheck:
      test: mc-health
      start_period: 2m
      interval: 30s
      retries: 3

    # 停止時のワールド保存猶予
    stop_grace_period: 60s
`;
}

// サーバーの docker-compose.yml パスを取得
export function getServerComposePath(id: string): string {
  if (id === DEFAULT_SERVER_ID) {
    return path.join(PROJECT_ROOT, 'docker-compose.yml');
  }
  return path.join(SERVERS_DIR, id, 'docker-compose.yml');
}

// サーバーのデータディレクトリパスを取得
export function getServerDataPath(id: string): string {
  if (id === DEFAULT_SERVER_ID) {
    return path.join(PROJECT_ROOT, 'server', 'data');
  }
  return path.join(SERVERS_DIR, id, 'data');
}

// サーバーのバックアップディレクトリパスを取得
export function getServerBackupPath(id: string): string {
  if (id === DEFAULT_SERVER_ID) {
    return path.join(PROJECT_ROOT, 'server', 'backups');
  }
  return path.join(SERVERS_DIR, id, 'backups');
}

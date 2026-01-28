// サーバーID
export const DEFAULT_SERVER_ID = 'default';

// ポート範囲
export const PORT_MIN = 1024;
export const PORT_MAX = 65535;

// デフォルトポート
export const DEFAULT_JAVA_PORT = 25565;
export const DEFAULT_RCON_PORT = 25575;
export const DEFAULT_BEDROCK_PORT = 19132;

// プレイヤー名
export const PLAYER_NAME_MIN_LENGTH = 3;
export const PLAYER_NAME_MAX_LENGTH = 16;

// サーバー名
export const SERVER_NAME_MAX_LENGTH = 50;

// プレイヤー数
export const MAX_PLAYERS_MIN = 1;
export const MAX_PLAYERS_MAX = 100;

// 描画距離
export const VIEW_DISTANCE_MIN = 3;
export const VIEW_DISTANCE_MAX = 32;

// スポーン保護
export const SPAWN_PROTECTION_MIN = 0;
export const SPAWN_PROTECTION_MAX = 100;

// パスワード
export const DEFAULT_PASSWORD_LENGTH = 16;

// ファイルサイズ
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * 1024;
export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * BYTES_PER_MB;
export const MAX_WORLD_UPLOAD_SIZE = 500 * BYTES_PER_MB; // 500MB

// タイムアウト（ミリ秒）
export const TIMEOUT_RCON_MS = 10000;
export const TIMEOUT_DOCKER_COMPOSE_MS = 60000;
export const TIMEOUT_DOCKER_INSPECT_MS = 10000;
export const TIMEOUT_DOCKER_STATS_MS = 30000;
export const TIMEOUT_DOCKER_LOGS_MS = 30000;
export const TIMEOUT_BACKUP_MS = 300000;
export const TIMEOUT_FULL_BACKUP_MS = 600000;

// ログ
export const DEFAULT_LOG_LINES = 100;
export const MAX_LOG_LINES = 1000;

// メッセージ長
export const MESSAGE_MAX_LENGTH = 256;
export const REASON_MAX_LENGTH = 100;

// server.properties デフォルト値
export const DEFAULT_MAX_PLAYERS = 20;
export const DEFAULT_VIEW_DISTANCE = 10;
export const DEFAULT_SIMULATION_DISTANCE = 10;
export const DEFAULT_MAX_WORLD_SIZE = 10000;
export const DEFAULT_MAX_TICK_TIME = 60000;
export const DEFAULT_NETWORK_COMPRESSION = 256;
export const DEFAULT_SPAWN_PROTECTION = 16;

// サーバーデフォルト設定
export const DEFAULT_PRESET_ID = 'balanced';
export const DEFAULT_VERSION = '1.21.1';
export const DEFAULT_MEMORY = '4G';
export const DEFAULT_LEVEL_NAME = 'world';
export const DEFAULT_SERVER_TYPE = 'FABRIC';

// フォルダ名
export const FOLDER_WORLD = 'world';
export const FOLDER_MODS = 'mods';
export const FOLDER_PLUGINS = 'plugins';
export const FOLDER_BACKUPS = 'backups';
export const FOLDER_DATA = 'data';

// ポーリング間隔（ミリ秒）
export const POLLING_INTERVAL_LOGS = 5000;
export const POLLING_INTERVAL_STATUS = 10000;
export const POLLING_INTERVAL_DASHBOARD = 30000;

// 外部API
export const MODRINTH_API_URL = 'https://api.modrinth.com/v2';

// 外部リソースURL
export const EXTERNAL_URLS = {
  HANGAR: 'https://hangar.papermc.io/',
  SPIGOT_MC: 'https://www.spigotmc.org/resources/',
  MODRINTH_PLUGINS: 'https://modrinth.com/plugins',
  MODRINTH_MODS: 'https://modrinth.com/mods',
  CURSE_FORGE: 'https://www.curseforge.com/minecraft/mc-mods',
} as const;

// プラグインドキュメントURL
export const PLUGIN_DOCS = {
  SPARK: 'https://spark.lucko.me/docs',
  LUCK_PERMS: 'https://luckperms.net/wiki',
  CHUNKY: 'https://github.com/pop4959/Chunky/wiki',
  GEYSER: 'https://geysermc.org/wiki',
  FLOODGATE: 'https://geysermc.org/wiki/floodgate',
} as const;

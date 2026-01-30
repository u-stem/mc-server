import type { ServerType } from '@/types';
import type { ServerTypeConfigSupport, ServerTypeConfigSupportMap } from '@/types/optimization';

/**
 * サーバータイプごとの設定ファイルサポートマッピング
 *
 * | タイプ | server.properties | bukkit.yml | spigot.yml | paper-*.yml | purpur.yml |
 * |--------|:-----------------:|:----------:|:----------:|:-----------:|:----------:|
 * | VANILLA | ✅ | - | - | - | - |
 * | SPIGOT | ✅ | ✅ | ✅ | - | - |
 * | PAPER | ✅ | ✅ | ✅ | ✅ | - |
 * | PURPUR | ✅ | ✅ | ✅ | ✅ | ✅ |
 * | FOLIA | ✅ | ✅ | ✅ | ✅ | - |
 * | MOHIST/ARCLIGHT/CATSERVER | ✅ | ✅ | ✅ | - | - |
 * | FABRIC/FORGE/NEOFORGE/QUILT | ✅ | - | - | - | - |
 * | BEDROCK | - | - | - | - | - |
 */
export const SERVER_TYPE_CONFIG_SUPPORT: ServerTypeConfigSupportMap = {
  // バニラ系
  VANILLA: {
    serverProperties: true,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },

  // Bukkit/Spigot系
  SPIGOT: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },

  // Paper系
  PAPER: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: true,
    paperGlobal: true,
    purpurYml: false,
  },

  // Purpur（Paper派生）
  PURPUR: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: true,
    paperGlobal: true,
    purpurYml: true,
  },

  // Folia（Paper派生、マルチスレッド）
  FOLIA: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: true,
    paperGlobal: true,
    purpurYml: false,
  },

  // ハイブリッド系（MOD+プラグイン、Spigot API互換）
  MOHIST: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
  ARCLIGHT: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
  CATSERVER: {
    serverProperties: true,
    bukkitYml: true,
    spigotYml: true,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },

  // MOD系（Vanilla互換）
  FABRIC: {
    serverProperties: true,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
  FORGE: {
    serverProperties: true,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
  NEOFORGE: {
    serverProperties: true,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
  QUILT: {
    serverProperties: true,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },

  // Bedrock（Java版とは別形式のため非サポート）
  BEDROCK: {
    serverProperties: false,
    bukkitYml: false,
    spigotYml: false,
    paperWorldDefaults: false,
    paperGlobal: false,
    purpurYml: false,
  },
};

/**
 * サーバータイプの設定ファイルサポートを取得
 */
export function getConfigSupport(serverType: ServerType): ServerTypeConfigSupport {
  return SERVER_TYPE_CONFIG_SUPPORT[serverType];
}

/**
 * サーバータイプが指定された設定ファイルをサポートするかチェック
 */
export function supportsConfigFile(
  serverType: ServerType,
  configFile: keyof ServerTypeConfigSupport
): boolean {
  return SERVER_TYPE_CONFIG_SUPPORT[serverType][configFile];
}

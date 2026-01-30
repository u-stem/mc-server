import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ServerConfig } from '@/types';
import {
  generateBukkitYml,
  generatePaperGlobal,
  generatePaperWorldDefaults,
  generatePurpurYml,
  generateSpigotYml,
} from './generators';
import { getOptimizationProfile } from './profiles';
import { getConfigSupport } from './support';

/**
 * サーバーに最適化設定を適用
 *
 * @param server サーバー設定
 * @param dataPath サーバーのデータディレクトリパス
 */
export async function applyOptimizations(server: ServerConfig, dataPath: string): Promise<void> {
  const configSupport = getConfigSupport(server.type);
  const profile = getOptimizationProfile(server.presetId);

  // データディレクトリが存在することを確認
  await fs.mkdir(dataPath, { recursive: true });

  // bukkit.yml
  if (configSupport.bukkitYml && profile.bukkit) {
    const bukkitPath = path.join(dataPath, 'bukkit.yml');
    await fs.writeFile(bukkitPath, generateBukkitYml(profile.bukkit), 'utf-8');
  }

  // spigot.yml
  if (configSupport.spigotYml && profile.spigot) {
    const spigotPath = path.join(dataPath, 'spigot.yml');
    await fs.writeFile(spigotPath, generateSpigotYml(profile.spigot), 'utf-8');
  }

  // Paper設定ファイル（config/ディレクトリ内）
  if (configSupport.paperWorldDefaults || configSupport.paperGlobal) {
    const configDir = path.join(dataPath, 'config');
    await fs.mkdir(configDir, { recursive: true });

    // paper-world-defaults.yml
    if (configSupport.paperWorldDefaults && profile.paperWorld) {
      const paperWorldPath = path.join(configDir, 'paper-world-defaults.yml');
      await fs.writeFile(paperWorldPath, generatePaperWorldDefaults(profile.paperWorld), 'utf-8');
    }

    // paper-global.yml
    if (configSupport.paperGlobal && profile.paperGlobal) {
      const paperGlobalPath = path.join(configDir, 'paper-global.yml');
      await fs.writeFile(paperGlobalPath, generatePaperGlobal(profile.paperGlobal), 'utf-8');
    }
  }

  // purpur.yml
  if (configSupport.purpurYml && profile.purpur) {
    const purpurPath = path.join(dataPath, 'purpur.yml');
    await fs.writeFile(purpurPath, generatePurpurYml(profile.purpur), 'utf-8');
  }

  // server.properties は itzg/minecraft-server が環境変数から生成するため、
  // 追加の最適化設定（sync-chunk-writes, network-compression-threshold）は
  // docker-compose.yml の環境変数として設定することを推奨
  // 必要に応じて将来的に環境変数生成に追加可能
}

/**
 * 最適化設定が適用されているかチェック
 *
 * @param dataPath サーバーのデータディレクトリパス
 * @returns 最適化設定ファイルの存在状況
 */
export async function checkOptimizationStatus(dataPath: string): Promise<Record<string, boolean>> {
  const files = {
    'bukkit.yml': path.join(dataPath, 'bukkit.yml'),
    'spigot.yml': path.join(dataPath, 'spigot.yml'),
    'paper-world-defaults.yml': path.join(dataPath, 'config', 'paper-world-defaults.yml'),
    'paper-global.yml': path.join(dataPath, 'config', 'paper-global.yml'),
    'purpur.yml': path.join(dataPath, 'purpur.yml'),
  };

  const status: Record<string, boolean> = {};

  for (const [name, filePath] of Object.entries(files)) {
    try {
      await fs.access(filePath);
      status[name] = true;
    } catch {
      status[name] = false;
    }
  }

  return status;
}

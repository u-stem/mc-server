import type { ServerType } from './server';

// サーバータイプごとの設定ファイルサポート
export interface ServerTypeConfigSupport {
  serverProperties: boolean;
  bukkitYml: boolean;
  spigotYml: boolean;
  paperWorldDefaults: boolean;
  paperGlobal: boolean;
  purpurYml: boolean;
}

// server.properties の最適化設定
export interface ServerPropertiesOptimization {
  // パフォーマンス設定
  syncChunkWrites: boolean;
  networkCompressionThreshold: number;
}

// bukkit.yml の最適化設定
export interface BukkitOptimization {
  spawnLimits: {
    monsters: number;
    animals: number;
    waterAnimals: number;
    waterAmbient: number;
    waterUndergroundCreature: number;
    axolotls: number;
    ambient: number;
  };
  ticksPer: {
    animalSpawns: number;
    monsterSpawns: number;
    waterSpawns: number;
    waterAmbientSpawns: number;
    waterUndergroundCreatureSpawns: number;
    axolotlSpawns: number;
    ambientSpawns: number;
    autosave: number;
  };
}

// spigot.yml の最適化設定
export interface SpigotOptimization {
  worldSettings: {
    mergeRadius: {
      item: number;
      exp: number;
    };
    mobSpawnRange: number;
    entityActivationRange: {
      animals: number;
      monsters: number;
      raiders: number;
      misc: number;
      water: number;
      villagers: number;
      flyingMonsters: number;
    };
    tickInactiveVillagers: boolean;
    nerf: {
      spawnedMobsHaveNoAi: boolean;
    };
  };
}

// paper-world-defaults.yml の最適化設定
export interface PaperWorldOptimization {
  chunks: {
    autoSaveInterval: number;
    maxAutoSaveChunksPerTick: number;
    preventMovingIntoUnloadedChunks: boolean;
    delayChunkUnloadsBy: string;
  };
  entities: {
    armorStands: {
      doCollisionEntityLookups: boolean;
      tick: boolean;
    };
    spawning: {
      despawnRanges: {
        soft: number;
        hard: number;
      };
      perPlayerMobSpawns: boolean;
      scanForLegacyEnderDragon: boolean;
    };
  };
  environment: {
    optimizeExplosions: boolean;
    treasureMaps: {
      enabled: boolean;
      findAlreadyDiscoveredLootTables: boolean;
      findAlreadyDiscoveredVillagerTradeLootTables: boolean;
    };
    waterOverLavaFlowSpeed: number;
  };
  hopper: {
    cooldownWhenFull: boolean;
    disableMoveEvent: boolean;
    ignoreOccludingBlocks: boolean;
  };
  collisions: {
    maxEntityCollisions: number;
    fixClimbingBypassingCrammingRule: boolean;
  };
  misc: {
    redstoneImplementation: 'VANILLA' | 'EIGENCRAFT' | 'ALTERNATE_CURRENT';
    updatePathfindingOnBlockUpdate: boolean;
  };
}

// paper-global.yml の最適化設定
export interface PaperGlobalOptimization {
  chunkLoading: {
    autoConfigSendDistance: boolean;
    enableFrustumPriority: boolean;
    globalMaxChunkLoadRate: number;
    globalMaxChunkSendRate: number;
    globalMaxConcurrentLoads: number;
    maxConcurrentSends: number;
    minLoadRadius: number;
    playerMaxChunkLoadRate: number;
    playerMaxConcurrentLoads: number;
    targetPlayerChunkSendRate: number;
  };
  itemValidation: {
    displayName: number;
    locName: number;
    loreLineLength: number;
    bookTitle: number;
    bookAuthor: number;
    bookPageLength: number;
    bookMaxPages: number;
  };
  packetLimiter: {
    allPackets: {
      interval: number;
      maxPacketRate: number;
    };
  };
  misc: {
    maxJoinsPerTick: number;
    regionFileCacheSize: number;
    useAlternativeLuckFormula: boolean;
    lagCompensateBlockBreaking: boolean;
  };
}

// purpur.yml の最適化設定
export interface PurpurOptimization {
  settings: {
    useAlternateKeepAlive: boolean;
    tpsBarEnabled: boolean;
    laggingThreshold: number;
  };
  worldSettings: {
    gameplay: {
      arrowMovement: {
        resetDespawnCounter: boolean;
      };
      useBetterMending: boolean;
    };
    mobs: {
      villager: {
        brainTicks: number;
        spawnIronGolemRadius: number;
      };
      zombie: {
        aggressiveTowardsVillagerWhenLagging: boolean;
      };
    };
  };
}

// 統合最適化プロファイル
export interface OptimizationProfile {
  serverProperties: ServerPropertiesOptimization;
  bukkit?: BukkitOptimization;
  spigot?: SpigotOptimization;
  paperWorld?: PaperWorldOptimization;
  paperGlobal?: PaperGlobalOptimization;
  purpur?: PurpurOptimization;
}

// サーバータイプと設定サポートのマッピング型
export type ServerTypeConfigSupportMap = Record<ServerType, ServerTypeConfigSupport>;

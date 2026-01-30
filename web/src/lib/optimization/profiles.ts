import type {
  BukkitOptimization,
  OptimizationProfile,
  PaperGlobalOptimization,
  PaperWorldOptimization,
  PurpurOptimization,
  ServerPropertiesOptimization,
  SpigotOptimization,
} from '@/types/optimization';

/**
 * server.properties のデフォルト最適化設定
 */
export const DEFAULT_SERVER_PROPERTIES: ServerPropertiesOptimization = {
  // sync-chunk-writes: false にすることでディスクI/Oを非同期化
  syncChunkWrites: false,
  // network-compression-threshold: 512 (デフォルト256) で小さいパケットの圧縮をスキップ
  networkCompressionThreshold: 512,
};

/**
 * bukkit.yml のデフォルト最適化設定
 */
export const DEFAULT_BUKKIT: BukkitOptimization = {
  spawnLimits: {
    // デフォルト: 70, 最適化: 50 でモンスターのスポーン数を削減
    monsters: 50,
    // デフォルト: 10, 最適化: 8
    animals: 8,
    // デフォルト: 5, 最適化: 3
    waterAnimals: 3,
    // デフォルト: 20, 最適化: 10
    waterAmbient: 10,
    // デフォルト: 5, 最適化: 3
    waterUndergroundCreature: 3,
    // デフォルト: 5, 最適化: 3
    axolotls: 3,
    // デフォルト: 15, 最適化: 4
    ambient: 4,
  },
  ticksPer: {
    // デフォルト: 400, 最適化: 400 (変更なし)
    animalSpawns: 400,
    // デフォルト: 1, 最適化: 5 でモンスタースポーン頻度を下げる
    monsterSpawns: 5,
    // デフォルト: 1, 最適化: 2
    waterSpawns: 2,
    // デフォルト: 1, 最適化: 40
    waterAmbientSpawns: 40,
    // デフォルト: 1, 最適化: 40
    waterUndergroundCreatureSpawns: 40,
    // デフォルト: 1, 最適化: 40
    axolotlSpawns: 40,
    // デフォルト: 1, 最適化: 40
    ambientSpawns: 40,
    // デフォルト: 6000, 最適化: 6000 (5分、変更なし)
    autosave: 6000,
  },
};

/**
 * spigot.yml のデフォルト最適化設定
 */
export const DEFAULT_SPIGOT: SpigotOptimization = {
  worldSettings: {
    mergeRadius: {
      // デフォルト: 2.5, 最適化: 3.5 でアイテムをより広範囲でマージ
      item: 3.5,
      // デフォルト: 3.0, 最適化: 4.0 で経験値オーブをより広範囲でマージ
      exp: 4.0,
    },
    // デフォルト: 8, 最適化: 6 でモブのスポーン範囲を縮小
    mobSpawnRange: 6,
    entityActivationRange: {
      // デフォルト: 32, 最適化: 16
      animals: 16,
      // デフォルト: 32, 最適化: 24
      monsters: 24,
      // デフォルト: 64, 最適化: 48 (レイダーは重要なのでやや広め)
      raiders: 48,
      // デフォルト: 16, 最適化: 8
      misc: 8,
      // デフォルト: 16, 最適化: 12
      water: 12,
      // デフォルト: 32, 最適化: 24
      villagers: 24,
      // デフォルト: 32, 最適化: 48 (ファントム等は広め)
      flyingMonsters: 48,
    },
    // 非アクティブな村人もティックする（取引等のため）
    tickInactiveVillagers: true,
    nerf: {
      // スポーンされたモブのAIを無効化しない（ゲーム体験を維持）
      spawnedMobsHaveNoAi: false,
    },
  },
};

/**
 * paper-world-defaults.yml のデフォルト最適化設定
 */
export const DEFAULT_PAPER_WORLD: PaperWorldOptimization = {
  chunks: {
    // デフォルト: -1 (無効), 最適化: 6000 ticks (5分) で自動保存
    autoSaveInterval: 6000,
    // デフォルト: 24, 最適化: 12 で一度に保存するチャンク数を制限
    maxAutoSaveChunksPerTick: 12,
    // 未ロードチャンクへの移動を防止
    preventMovingIntoUnloadedChunks: true,
    // チャンクアンロードを10秒遅延（頻繁な出入りでの再ロード防止）
    delayChunkUnloadsBy: '10s',
  },
  entities: {
    armorStands: {
      // アーマースタンドのコリジョン検索を無効化
      doCollisionEntityLookups: false,
      // アーマースタンドのティックを無効化（パフォーマンス向上）
      tick: false,
    },
    spawning: {
      despawnRanges: {
        // デフォルト: 32, 最適化: 28 でソフトデスポーン範囲を縮小
        soft: 28,
        // デフォルト: 128, 最適化: 96 でハードデスポーン範囲を縮小
        hard: 96,
      },
      // プレイヤーごとのモブスポーン（より公平な分配）
      perPlayerMobSpawns: true,
      // レガシーエンダードラゴンのスキャンを無効化
      scanForLegacyEnderDragon: false,
    },
  },
  environment: {
    // 爆発の最適化を有効化
    optimizeExplosions: true,
    treasureMaps: {
      // 宝の地図は有効（無効化すると体験が損なわれる）
      enabled: true,
      // 既に発見された構造物を探さない（パフォーマンス向上）
      findAlreadyDiscoveredLootTables: false,
      findAlreadyDiscoveredVillagerTradeLootTables: false,
    },
    // 溶岩上の水の流れ速度（デフォルト5）
    waterOverLavaFlowSpeed: 5,
  },
  hopper: {
    // ホッパーが満杯時のクールダウンを有効化
    cooldownWhenFull: true,
    // ホッパーの移動イベントを無効化（パフォーマンス向上、一部プラグインで問題の可能性）
    disableMoveEvent: false,
    // ホッパーが遮蔽ブロックを無視
    ignoreOccludingBlocks: false,
  },
  collisions: {
    // デフォルト: 8, 最適化: 2 で最大エンティティ衝突数を制限
    maxEntityCollisions: 2,
    // クライミング中のクラミングルール回避を修正
    fixClimbingBypassingCrammingRule: true,
  },
  misc: {
    // ALTERNATE_CURRENT: 高速なレッドストーン実装
    redstoneImplementation: 'ALTERNATE_CURRENT',
    // ブロック更新時のパスファインディング更新を有効（無効化すると挙動が変わる）
    updatePathfindingOnBlockUpdate: true,
  },
};

/**
 * paper-global.yml のデフォルト最適化設定
 */
export const DEFAULT_PAPER_GLOBAL: PaperGlobalOptimization = {
  chunkLoading: {
    // 送信距離の自動設定を有効化
    autoConfigSendDistance: true,
    // フラスタム優先度を有効化
    enableFrustumPriority: false,
    // グローバルチャンクロード制限
    globalMaxChunkLoadRate: -1.0,
    globalMaxChunkSendRate: -1.0,
    globalMaxConcurrentLoads: 500.0,
    // 同時送信数の上限
    maxConcurrentSends: 2,
    // 最小ロード半径
    minLoadRadius: 2,
    // プレイヤーごとのチャンクロード制限
    playerMaxChunkLoadRate: -1.0,
    playerMaxConcurrentLoads: 20.0,
    // ターゲット送信レート
    targetPlayerChunkSendRate: 100.0,
  },
  itemValidation: {
    // アイテム検証の制限値
    displayName: 8192,
    locName: 8192,
    loreLineLength: 8192,
    bookTitle: 8192,
    bookAuthor: 8192,
    bookPageLength: 16384,
    bookMaxPages: 2560,
  },
  packetLimiter: {
    allPackets: {
      interval: 7.0,
      maxPacketRate: 500.0,
    },
  },
  misc: {
    // 1ティックあたりの最大参加数
    maxJoinsPerTick: 3,
    // リージョンファイルキャッシュサイズ
    regionFileCacheSize: 256,
    // 代替ラック計算式を使用
    useAlternativeLuckFormula: false,
    // ブロック破壊のラグ補正
    lagCompensateBlockBreaking: true,
  },
};

/**
 * purpur.yml のデフォルト最適化設定
 */
export const DEFAULT_PURPUR: PurpurOptimization = {
  settings: {
    // 代替キープアライブを使用（タイムアウト問題を軽減）
    useAlternateKeepAlive: true,
    // TPSバーを有効化（管理者向け）
    tpsBarEnabled: false,
    // ラグ判定の閾値（TPS）
    laggingThreshold: 19.0,
  },
  worldSettings: {
    gameplay: {
      arrowMovement: {
        // 矢の移動時にデスポーンカウンターをリセットしない
        resetDespawnCounter: false,
      },
      // 改良版メンディングを使用（より直感的な修繕）
      useBetterMending: true,
    },
    mobs: {
      villager: {
        // デフォルト: 1, 最適化: 2 で村人のブレインティックを減少
        brainTicks: 2,
        // アイアンゴーレムのスポーン半径
        spawnIronGolemRadius: 0,
      },
      zombie: {
        // ラグ時もゾンビが村人に敵対的
        aggressiveTowardsVillagerWhenLagging: true,
      },
    },
  },
};

/**
 * デフォルトの最適化プロファイル
 * すべてのサーバータイプで使用される基本設定
 */
export const DEFAULT_OPTIMIZATION_PROFILE: OptimizationProfile = {
  serverProperties: DEFAULT_SERVER_PROPERTIES,
  bukkit: DEFAULT_BUKKIT,
  spigot: DEFAULT_SPIGOT,
  paperWorld: DEFAULT_PAPER_WORLD,
  paperGlobal: DEFAULT_PAPER_GLOBAL,
  purpur: DEFAULT_PURPUR,
};

/**
 * 最適化プロファイルを取得
 * 将来的にはプリセットIDに基づいて異なるプロファイルを返すことが可能
 */
export function getOptimizationProfile(_presetId?: string): OptimizationProfile {
  // 現時点ではすべてのプリセットで同じ最適化設定を使用
  // 将来的には presetId に基づいて異なる最適化レベル（aggressive, moderate, conservative）を提供可能
  return DEFAULT_OPTIMIZATION_PROFILE;
}

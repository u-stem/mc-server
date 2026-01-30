// Server types

// API types
export type { ApiResponse, VersionUpdateRequest, VersionUpdateResponse } from './api';
// Automation types
export type {
  AlertThresholds,
  AutoBackupConfig,
  AutomationConfig,
  BackupState,
  DiscordEmbed,
  DiscordNotificationType,
  DiscordWebhookConfig,
  HealthCheckConfig,
  HealthState,
  PluginAutoUpdateConfig,
  PluginUpdateInfo,
  PluginUpdateState,
} from './automation';
export {
  DEFAULT_ALERT_THRESHOLDS,
  DEFAULT_AUTO_BACKUP_CONFIG,
  DEFAULT_AUTOMATION_CONFIG,
  DEFAULT_BACKUP_STATE,
  DEFAULT_DISCORD_CONFIG,
  DEFAULT_HEALTH_CHECK_CONFIG,
  DEFAULT_HEALTH_STATE,
  DEFAULT_PLUGIN_UPDATE_CONFIG,
  DEFAULT_PLUGIN_UPDATE_STATE,
} from './automation';
// Optimization types
export type {
  BukkitOptimization,
  OptimizationProfile,
  PaperGlobalOptimization,
  PaperWorldOptimization,
  PurpurOptimization,
  ServerPropertiesOptimization,
  ServerTypeConfigSupport,
  ServerTypeConfigSupportMap,
  SpigotOptimization,
} from './optimization';
// Plugin/Mod types
export type { AddOnFileInfo, ModInfo, PluginInfo } from './plugin';
// Preset types
export type { PresetSettings, ServerPreset } from './presets';
export {
  DEFAULT_PRESET_SETTINGS,
  getPresetById,
  mergePresetSettings,
  SERVER_PRESETS,
} from './presets';
// Property types
export type { PropertyCategoryDefinition, PropertyDefinition } from './properties';
export { PROPERTY_CATEGORIES, type PropertyCategory } from './properties';
// Route types
export type {
  ApiDeleteResponse,
  ApiSuccessResponse,
  BackupIdParams,
  FilenameParams,
  PlayerNameParams,
  RouteParams,
  ServerIdParams,
} from './routes';
// Schedule types
export type { DaySchedule, ServerSchedule } from './schedule';
export { DEFAULT_DAY_SCHEDULE, DEFAULT_SERVER_SCHEDULE } from './schedule';
export type {
  BackupInfo,
  CreateServerRequest,
  ServerConfig,
  ServerDetails,
  ServerEdition,
  ServerStatus,
  ServersConfigFile,
  ServerType,
  TpsInfo,
  WhitelistEntry,
} from './server';
export {
  BEDROCK_SERVER_TYPES,
  isBedrockServer,
  isModServer,
  isPluginServer,
  MOD_SERVER_TYPES,
  PLUGIN_SERVER_TYPES,
  supportsTps,
  TPS_SUPPORTED_SERVER_TYPES,
} from './server';

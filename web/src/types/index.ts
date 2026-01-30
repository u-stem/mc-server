// Server types

// API types
export type { ApiResponse, VersionUpdateRequest, VersionUpdateResponse } from './api';
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
export type { ModInfo, PluginInfo } from './plugin';
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
  WhitelistEntry,
} from './server';
export {
  BEDROCK_SERVER_TYPES,
  isBedrockServer,
  isModServer,
  isPluginServer,
  MOD_SERVER_TYPES,
  PLUGIN_SERVER_TYPES,
} from './server';

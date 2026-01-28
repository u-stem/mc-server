// アドオンファイル情報（Mod/プラグイン共通）
export interface AddOnFileInfo {
  filename: string;
  size: number;
  enabled: boolean;
  modifiedAt: string;
}

// Mod情報（AddOnFileInfoのエイリアス）
export type ModInfo = AddOnFileInfo;

// プラグイン情報（AddOnFileInfoのエイリアス）
export type PluginInfo = AddOnFileInfo;

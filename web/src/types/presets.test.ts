import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESET_SETTINGS,
  getPresetById,
  mergePresetSettings,
  SERVER_PRESETS,
} from './presets';

describe('SERVER_PRESETS', () => {
  it('5つのプリセットが定義されている', () => {
    expect(SERVER_PRESETS).toHaveLength(5);
  });

  it('すべてのプリセットに必須フィールドがある', () => {
    for (const preset of SERVER_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.description).toBeDefined();
      expect(preset.icon).toBeDefined();
      expect(preset.settings).toBeDefined();
    }
  });

  it('balanced プリセットが recommended に設定されている', () => {
    const balanced = SERVER_PRESETS.find((p) => p.id === 'balanced');
    expect(balanced?.recommended).toBe(true);
  });

  it('各プリセットのIDがユニーク', () => {
    const ids = SERVER_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('DEFAULT_PRESET_SETTINGS', () => {
  it('すべての設定フィールドが定義されている', () => {
    expect(DEFAULT_PRESET_SETTINGS.useAikarFlags).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.viewDistance).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.simulationDistance).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.difficulty).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.gamemode).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.pvp).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.hardcore).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.allowFlight).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.forceGamemode).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.spawnMonsters).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.spawnAnimals).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.spawnNpcs).toBeDefined();
    expect(DEFAULT_PRESET_SETTINGS.spawnProtection).toBeDefined();
  });

  it('デフォルト値が適切に設定されている', () => {
    expect(DEFAULT_PRESET_SETTINGS.difficulty).toBe('normal');
    expect(DEFAULT_PRESET_SETTINGS.gamemode).toBe('survival');
    expect(DEFAULT_PRESET_SETTINGS.hardcore).toBe(false);
    expect(DEFAULT_PRESET_SETTINGS.useAikarFlags).toBe(true);
  });
});

describe('getPresetById', () => {
  it('存在するプリセットIDで正しいプリセットを返す', () => {
    const balanced = getPresetById('balanced');
    expect(balanced).toBeDefined();
    expect(balanced?.id).toBe('balanced');
    expect(balanced?.name).toBe('バランス');
  });

  it('存在するすべてのプリセットを取得できる', () => {
    expect(getPresetById('balanced')).toBeDefined();
    expect(getPresetById('lightweight')).toBeDefined();
    expect(getPresetById('creative')).toBeDefined();
    expect(getPresetById('hardcore')).toBeDefined();
    expect(getPresetById('friendly')).toBeDefined();
  });

  it('存在しないプリセットIDで undefined を返す', () => {
    expect(getPresetById('nonexistent')).toBeUndefined();
    expect(getPresetById('')).toBeUndefined();
  });

  it('各プリセットの設定が期待通り', () => {
    const lightweight = getPresetById('lightweight');
    expect(lightweight?.settings.viewDistance).toBe(6);
    expect(lightweight?.settings.simulationDistance).toBe(6);

    const creative = getPresetById('creative');
    expect(creative?.settings.difficulty).toBe('peaceful');
    expect(creative?.settings.gamemode).toBe('creative');
    expect(creative?.settings.spawnMonsters).toBe(false);

    const hardcore = getPresetById('hardcore');
    expect(hardcore?.settings.difficulty).toBe('hard');
    expect(hardcore?.settings.hardcore).toBe(true);

    const friendly = getPresetById('friendly');
    expect(friendly?.settings.difficulty).toBe('peaceful');
    expect(friendly?.settings.pvp).toBe(false);
    expect(friendly?.settings.spawnProtection).toBe(32);
  });
});

describe('mergePresetSettings', () => {
  it('プリセットIDのみでプリセット設定を返す', () => {
    const settings = mergePresetSettings('balanced');
    expect(settings).toEqual(DEFAULT_PRESET_SETTINGS);
  });

  it('存在しないプリセットIDでデフォルト設定を返す', () => {
    const settings = mergePresetSettings('nonexistent');
    expect(settings).toEqual(DEFAULT_PRESET_SETTINGS);
  });

  it('カスタム設定でプリセット設定を上書きする', () => {
    const settings = mergePresetSettings('balanced', {
      viewDistance: 16,
      difficulty: 'hard',
    });

    expect(settings.viewDistance).toBe(16);
    expect(settings.difficulty).toBe('hard');
    // 他の設定はデフォルトのまま
    expect(settings.gamemode).toBe('survival');
    expect(settings.simulationDistance).toBe(10);
  });

  it('undefined のカスタム設定でプリセット設定をそのまま返す', () => {
    const settings = mergePresetSettings('lightweight', undefined);

    expect(settings.viewDistance).toBe(6);
    expect(settings.simulationDistance).toBe(6);
  });

  it('元のプリセット設定を変更しない（イミュータブル）', () => {
    const original = getPresetById('balanced');
    const originalViewDistance = original?.settings.viewDistance;

    mergePresetSettings('balanced', { viewDistance: 20 });

    expect(original?.settings.viewDistance).toBe(originalViewDistance);
  });

  it('lightweight プリセットにカスタム設定をマージ', () => {
    const settings = mergePresetSettings('lightweight', {
      pvp: false,
      hardcore: true,
    });

    expect(settings.viewDistance).toBe(6); // lightweight の設定
    expect(settings.simulationDistance).toBe(6); // lightweight の設定
    expect(settings.pvp).toBe(false); // カスタム設定
    expect(settings.hardcore).toBe(true); // カスタム設定
  });
});

import { describe, expect, it } from 'vitest';
import {
  BEDROCK_SERVER_TYPES,
  isBedrockServer,
  isModServer,
  isPluginServer,
  MOD_SERVER_TYPES,
  PLUGIN_SERVER_TYPES,
  type ServerType,
} from './server';

describe('MOD_SERVER_TYPES', () => {
  it('MODサーバータイプを含む', () => {
    expect(MOD_SERVER_TYPES).toContain('FABRIC');
    expect(MOD_SERVER_TYPES).toContain('FORGE');
    expect(MOD_SERVER_TYPES).toContain('NEOFORGE');
    expect(MOD_SERVER_TYPES).toContain('QUILT');
  });

  it('ハイブリッドサーバータイプを含む', () => {
    expect(MOD_SERVER_TYPES).toContain('MOHIST');
    expect(MOD_SERVER_TYPES).toContain('ARCLIGHT');
    expect(MOD_SERVER_TYPES).toContain('CATSERVER');
  });

  it('プラグイン専用サーバータイプを含まない', () => {
    expect(MOD_SERVER_TYPES).not.toContain('SPIGOT');
    expect(MOD_SERVER_TYPES).not.toContain('PAPER');
    expect(MOD_SERVER_TYPES).not.toContain('VANILLA');
  });
});

describe('PLUGIN_SERVER_TYPES', () => {
  it('プラグインサーバータイプを含む', () => {
    expect(PLUGIN_SERVER_TYPES).toContain('SPIGOT');
    expect(PLUGIN_SERVER_TYPES).toContain('PAPER');
    expect(PLUGIN_SERVER_TYPES).toContain('PURPUR');
    expect(PLUGIN_SERVER_TYPES).toContain('FOLIA');
  });

  it('ハイブリッドサーバータイプを含む', () => {
    expect(PLUGIN_SERVER_TYPES).toContain('MOHIST');
    expect(PLUGIN_SERVER_TYPES).toContain('ARCLIGHT');
    expect(PLUGIN_SERVER_TYPES).toContain('CATSERVER');
  });

  it('MOD専用サーバータイプを含まない', () => {
    expect(PLUGIN_SERVER_TYPES).not.toContain('FABRIC');
    expect(PLUGIN_SERVER_TYPES).not.toContain('FORGE');
  });
});

describe('BEDROCK_SERVER_TYPES', () => {
  it('BEDROCKのみを含む', () => {
    expect(BEDROCK_SERVER_TYPES).toEqual(['BEDROCK']);
  });
});

describe('isModServer', () => {
  it('MODサーバータイプに対して true を返す', () => {
    expect(isModServer('FABRIC')).toBe(true);
    expect(isModServer('FORGE')).toBe(true);
    expect(isModServer('NEOFORGE')).toBe(true);
    expect(isModServer('QUILT')).toBe(true);
  });

  it('ハイブリッドサーバータイプに対して true を返す', () => {
    expect(isModServer('MOHIST')).toBe(true);
    expect(isModServer('ARCLIGHT')).toBe(true);
    expect(isModServer('CATSERVER')).toBe(true);
  });

  it('プラグイン専用サーバータイプに対して false を返す', () => {
    expect(isModServer('SPIGOT')).toBe(false);
    expect(isModServer('PAPER')).toBe(false);
    expect(isModServer('VANILLA')).toBe(false);
  });

  it('Bedrockサーバータイプに対して false を返す', () => {
    expect(isModServer('BEDROCK')).toBe(false);
  });
});

describe('isPluginServer', () => {
  it('プラグインサーバータイプに対して true を返す', () => {
    expect(isPluginServer('SPIGOT')).toBe(true);
    expect(isPluginServer('PAPER')).toBe(true);
    expect(isPluginServer('PURPUR')).toBe(true);
    expect(isPluginServer('FOLIA')).toBe(true);
  });

  it('ハイブリッドサーバータイプに対して true を返す', () => {
    expect(isPluginServer('MOHIST')).toBe(true);
    expect(isPluginServer('ARCLIGHT')).toBe(true);
    expect(isPluginServer('CATSERVER')).toBe(true);
  });

  it('MOD専用サーバータイプに対して false を返す', () => {
    expect(isPluginServer('FABRIC')).toBe(false);
    expect(isPluginServer('FORGE')).toBe(false);
    expect(isPluginServer('QUILT')).toBe(false);
  });

  it('Bedrockサーバータイプに対して false を返す', () => {
    expect(isPluginServer('BEDROCK')).toBe(false);
  });
});

describe('isBedrockServer', () => {
  it('BEDROCKに対して true を返す', () => {
    expect(isBedrockServer('BEDROCK')).toBe(true);
  });

  it('Java版サーバータイプに対して false を返す', () => {
    const javaTypes: ServerType[] = [
      'FABRIC',
      'FORGE',
      'NEOFORGE',
      'QUILT',
      'VANILLA',
      'SPIGOT',
      'PAPER',
      'PURPUR',
      'FOLIA',
      'MOHIST',
      'ARCLIGHT',
      'CATSERVER',
    ];

    for (const type of javaTypes) {
      expect(isBedrockServer(type)).toBe(false);
    }
  });
});

describe('ハイブリッドサーバー', () => {
  it('MOHIST, ARCLIGHT, CATSERVER は MOD と プラグイン両方をサポート', () => {
    const hybridTypes: ServerType[] = ['MOHIST', 'ARCLIGHT', 'CATSERVER'];

    for (const type of hybridTypes) {
      expect(isModServer(type)).toBe(true);
      expect(isPluginServer(type)).toBe(true);
      expect(isBedrockServer(type)).toBe(false);
    }
  });
});

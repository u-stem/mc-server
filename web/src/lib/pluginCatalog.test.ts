import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadPluginFromModrinth,
  getModrinthProject,
  getPluginDownloadUrl,
  type ModrinthProject,
  type ModrinthVersion,
  RECOMMENDED_PLUGINS,
} from './pluginCatalog';

// fetch をモック化
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RECOMMENDED_PLUGINS', () => {
  it('必須フィールドを持つプラグインリストである', () => {
    expect(RECOMMENDED_PLUGINS.length).toBeGreaterThan(0);
    for (const plugin of RECOMMENDED_PLUGINS) {
      expect(plugin).toHaveProperty('id');
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('description');
      expect(plugin).toHaveProperty('modrinthId');
      expect(plugin).toHaveProperty('category');
    }
  });

  it('カテゴリは有効な値である', () => {
    const validCategories = ['performance', 'utility', 'management'];
    for (const plugin of RECOMMENDED_PLUGINS) {
      expect(validCategories).toContain(plugin.category);
    }
  });
});

describe('getModrinthProject', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常にプロジェクト情報を取得する', async () => {
    const mockProject: ModrinthProject = {
      id: 'abc123',
      slug: 'spark',
      title: 'Spark',
      description: 'A performance profiler',
      downloads: 1000000,
      icon_url: 'https://example.com/icon.png',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    });

    const result = await getModrinthProject('spark');

    expect(result).toEqual(mockProject);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/project/spark'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
        }),
      })
    );
  });

  it('APIエラー時はnullを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await getModrinthProject('nonexistent');
    expect(result).toBeNull();
  });

  it('ネットワークエラー時はnullを返す', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getModrinthProject('spark');
    expect(result).toBeNull();
  });
});

describe('getPluginDownloadUrl', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockVersions: ModrinthVersion[] = [
    {
      id: 'v1',
      name: 'Version 1.0',
      version_number: '1.0.0',
      game_versions: ['1.21.1', '1.21'],
      loaders: ['paper', 'spigot'],
      files: [
        { url: 'https://cdn.modrinth.com/test.jar', filename: 'plugin-1.0.0.jar', size: 12345 },
      ],
    },
    {
      id: 'v2',
      name: 'Version 0.9',
      version_number: '0.9.0',
      game_versions: ['1.20.4'],
      loaders: ['bukkit'],
      files: [
        { url: 'https://cdn.modrinth.com/old.jar', filename: 'plugin-0.9.0.jar', size: 11000 },
      ],
    },
  ];

  it('MCバージョンに対応するプラグインURLを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersions,
    });

    const result = await getPluginDownloadUrl('test-plugin', '1.21.1');

    expect(result).toEqual({
      url: 'https://cdn.modrinth.com/test.jar',
      filename: 'plugin-1.0.0.jar',
      size: 12345,
    });
  });

  it('対応するMCバージョンがない場合は最新を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersions,
    });

    const result = await getPluginDownloadUrl('test-plugin', '1.19.4');

    expect(result).not.toBeNull();
    expect(result?.filename).toBe('plugin-1.0.0.jar');
  });

  it('APIエラー時はnullを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await getPluginDownloadUrl('test-plugin', '1.21.1');
    expect(result).toBeNull();
  });

  it('バージョンが空の場合はnullを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await getPluginDownloadUrl('test-plugin', '1.21.1');
    expect(result).toBeNull();
  });
});

describe('downloadPluginFromModrinth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('プラグインをダウンロードしてBufferを返す', async () => {
    const mockVersions: ModrinthVersion[] = [
      {
        id: 'v1',
        name: 'Version 1.0',
        version_number: '1.0.0',
        game_versions: ['1.21.1'],
        loaders: ['paper'],
        files: [{ url: 'https://cdn.modrinth.com/test.jar', filename: 'plugin.jar', size: 100 }],
      },
    ];

    const mockFileContent = new ArrayBuffer(100);

    // 1回目: バージョン情報取得
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersions,
    });

    // 2回目: ファイルダウンロード
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => mockFileContent,
    });

    const result = await downloadPluginFromModrinth('test-plugin', '1.21.1');

    expect(result).not.toBeNull();
    expect(result?.filename).toBe('plugin.jar');
    expect(Buffer.isBuffer(result?.buffer)).toBe(true);
  });

  it('ダウンロードURL取得失敗時はnullを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const result = await downloadPluginFromModrinth('nonexistent', '1.21.1');
    expect(result).toBeNull();
  });

  it('ダウンロード失敗時はnullを返す', async () => {
    const mockVersions: ModrinthVersion[] = [
      {
        id: 'v1',
        name: 'Version 1.0',
        version_number: '1.0.0',
        game_versions: ['1.21.1'],
        loaders: ['paper'],
        files: [{ url: 'https://cdn.modrinth.com/test.jar', filename: 'plugin.jar', size: 100 }],
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersions,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await downloadPluginFromModrinth('test-plugin', '1.21.1');
    expect(result).toBeNull();
  });
});

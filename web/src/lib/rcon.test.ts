import { promises as fs } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToWhitelist,
  banPlayer,
  executeConsoleCommand,
  fetchMojangUuid,
  generateOfflineUuid,
  getWhitelist,
  kickPlayer,
  removeFromWhitelist,
  sendMessage,
} from './rcon';

// Mock modules
vi.mock('./docker', () => ({
  getServerStatus: vi.fn(),
}));

vi.mock('./config', () => ({
  getServer: vi.fn(),
  getServerDataPath: vi.fn(),
}));

vi.mock('node:fs', () => {
  const actual = {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  };
  return { ...actual, default: actual };
});

vi.mock('rcon-client', () => ({
  Rcon: {
    connect: vi.fn(),
  },
}));

const { getServerStatus } = await import('./docker');
const { getServer, getServerDataPath } = await import('./config');
const { Rcon } = await import('rcon-client');

const mockedGetServerStatus = vi.mocked(getServerStatus);
const mockedGetServer = vi.mocked(getServer);
const mockedGetServerDataPath = vi.mocked(getServerDataPath);
const mockedReadFile = vi.mocked(fs.readFile);
const mockedWriteFile = vi.mocked(fs.writeFile);
const mockedMkdir = vi.mocked(fs.mkdir);
const mockedRconConnect = vi.mocked(Rcon.connect);

function createEnoentError(): NodeJS.ErrnoException {
  const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  return error;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('generateOfflineUuid', () => {
  it('UUID v3形式のversion bitsが設定される', () => {
    const uuid = generateOfflineUuid('TestPlayer');
    // version = 3: 13文字目が '3'
    expect(uuid[14]).toBe('3');
  });

  it('UUID v3形式のvariant bitsが設定される', () => {
    const uuid = generateOfflineUuid('TestPlayer');
    // variant = IETF: 19文字目が 8, 9, a, b のいずれか
    expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
  });

  it('正しいUUID形式 (8-4-4-4-12) を返す', () => {
    const uuid = generateOfflineUuid('Notch');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('同じプレイヤー名に対して同じUUIDを返す', () => {
    const uuid1 = generateOfflineUuid('Steve');
    const uuid2 = generateOfflineUuid('Steve');
    expect(uuid1).toBe(uuid2);
  });

  it('異なるプレイヤー名に対して異なるUUIDを返す', () => {
    const uuid1 = generateOfflineUuid('Steve');
    const uuid2 = generateOfflineUuid('Alex');
    expect(uuid1).not.toBe(uuid2);
  });

  it('Minecraft互換のオフラインUUIDを生成する (既知値検証)', () => {
    // MD5("OfflinePlayer:Notch") with UUID v3 version/variant bits
    expect(generateOfflineUuid('Notch')).toBe('b50ad385-829d-3141-a216-7e7d7539ba7f');
  });
});

describe('fetchMojangUuid', () => {
  it('APIが成功した場合にハイフン付きUUIDを返す', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '069a79f444e94726a5befca90e38aaf5', name: 'Notch' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const uuid = await fetchMojangUuid('Notch');

    expect(uuid).toBe('069a79f4-44e9-4726-a5be-fca90e38aaf5');
    expect(mockFetch).toHaveBeenCalledWith('https://api.mojang.com/users/profiles/minecraft/Notch');
  });

  it('APIが404を返した場合にnullを返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 404 }));

    const uuid = await fetchMojangUuid('NonExistentPlayer123');

    expect(uuid).toBeNull();
  });

  it('ネットワークエラー時にnullを返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')));

    const uuid = await fetchMojangUuid('Notch');

    expect(uuid).toBeNull();
  });

  it('プレイヤー名をURLエンコードする', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false });
    vi.stubGlobal('fetch', mockFetch);

    await fetchMojangUuid('test/player');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mojang.com/users/profiles/minecraft/test%2Fplayer'
    );
  });
});

// Helper to set up mocks for server-stopped file-editing path
const serverConfig = {
  id: 'default',
  name: 'Test',
  port: 25565,
  rconPort: 25575,
  rconPassword: 'test',
  version: '1.21.1',
  type: 'PAPER',
  memory: '4G',
  maxPlayers: 10,
  createdAt: '',
  updatedAt: '',
};

function setupStoppedServerMocks() {
  mockedGetServerStatus.mockResolvedValue({ running: false } as Awaited<
    ReturnType<typeof getServerStatus>
  >);
  mockedGetServer.mockResolvedValue(serverConfig);
  mockedGetServerDataPath.mockReturnValue('/data/server');
  mockedMkdir.mockResolvedValue(undefined);
  mockedWriteFile.mockResolvedValue(undefined);
}

function setupRunningServerMocks() {
  mockedGetServer.mockResolvedValue(serverConfig);
  mockedGetServerDataPath.mockReturnValue('/data/server');
}

describe('getWhitelist', () => {
  beforeEach(() => {
    setupStoppedServerMocks();
  });

  it('ファイルが存在しない場合は空配列を返す', async () => {
    mockedReadFile.mockRejectedValueOnce(createEnoentError());

    const result = await getWhitelist('default');

    expect(result).toEqual([]);
  });

  it('正常なJSONファイルを読み取る', async () => {
    const entries = [{ uuid: 'uuid-1', name: 'Steve' }];
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(entries) as never);

    const result = await getWhitelist('default');

    expect(result).toEqual(entries);
  });

  it('破損したJSONファイルの場合はエラーをスローする', async () => {
    mockedReadFile.mockResolvedValueOnce('invalid json{{{' as never);

    await expect(getWhitelist('default')).rejects.toThrow();
  });
});

describe('addToWhitelist (file editing path)', () => {
  beforeEach(() => {
    setupStoppedServerMocks();
  });

  it('新規プレイヤーをホワイトリストに追加する', async () => {
    mockedReadFile.mockRejectedValueOnce(createEnoentError());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }));

    const result = await addToWhitelist('default', 'Steve');

    expect(result).toBe('Added Steve to whitelist');
    expect(mockedWriteFile).toHaveBeenCalledOnce();
    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written).toHaveLength(1);
    expect(written[0].name).toBe('Steve');
    expect(written[0].uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('既存プレイヤーの重複追加を防ぐ', async () => {
    mockedReadFile.mockResolvedValueOnce(
      JSON.stringify([{ uuid: 'existing-uuid', name: 'Steve' }]) as never
    );

    const result = await addToWhitelist('default', 'steve');

    expect(result).toBe('Player steve is already whitelisted');
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });

  it('Mojang APIで正規UUIDを取得する', async () => {
    mockedReadFile.mockRejectedValueOnce(createEnoentError());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'abcdef1234567890abcdef1234567890', name: 'Notch' }),
      })
    );

    await addToWhitelist('default', 'Notch');

    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written[0].uuid).toBe('abcdef12-3456-7890-abcd-ef1234567890');
  });

  it('ディレクトリが存在しない場合に自動作成する', async () => {
    mockedReadFile.mockRejectedValueOnce(createEnoentError());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }));

    await addToWhitelist('default', 'Steve');

    expect(mockedMkdir).toHaveBeenCalledWith('/data/server', { recursive: true });
  });

  it('破損したJSONファイルの場合はエラーをスローする', async () => {
    mockedReadFile.mockResolvedValueOnce('not valid json' as never);

    await expect(addToWhitelist('default', 'Steve')).rejects.toThrow();
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });
});

describe('removeFromWhitelist (file editing path)', () => {
  beforeEach(() => {
    setupStoppedServerMocks();
  });

  it('プレイヤーをホワイトリストから削除する', async () => {
    mockedReadFile.mockResolvedValueOnce(
      JSON.stringify([
        { uuid: 'uuid-1', name: 'Steve' },
        { uuid: 'uuid-2', name: 'Alex' },
      ]) as never
    );

    const result = await removeFromWhitelist('default', 'Steve');

    expect(result).toBe('Removed Steve from whitelist');
    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written).toHaveLength(1);
    expect(written[0].name).toBe('Alex');
  });

  it('ファイルが存在しない場合にErrorをthrowする', async () => {
    mockedReadFile.mockRejectedValueOnce(createEnoentError());

    await expect(removeFromWhitelist('default', 'Steve')).rejects.toThrow(
      'ホワイトリストファイルが見つかりません'
    );
  });

  it('存在しないプレイヤーの削除はメッセージを返す', async () => {
    mockedReadFile.mockResolvedValueOnce(
      JSON.stringify([{ uuid: 'uuid-1', name: 'Steve' }]) as never
    );

    const result = await removeFromWhitelist('default', 'Alex');

    expect(result).toBe('Player Alex is not whitelisted');
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });

  it('破損したJSONファイルの場合はパースエラーをスローする', async () => {
    mockedReadFile.mockResolvedValueOnce('not valid json' as never);

    await expect(removeFromWhitelist('default', 'Steve')).rejects.toThrow(SyntaxError);
  });
});

// RCON-dependent tests
describe('sendMessage', () => {
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupRunningServerMocks();
    mockSend = vi.fn().mockResolvedValue('');
    mockedRconConnect.mockResolvedValue({
      send: mockSend,
      end: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('サニタイズされたメッセージをsayコマンドで送信する', async () => {
    await sendMessage('default', 'hello world');

    expect(mockSend).toHaveBeenCalledWith('say hello world');
  });

  it('特殊文字を除去する', async () => {
    await sendMessage('default', 'hello <script>alert(1)</script>');

    expect(mockSend).toHaveBeenCalledWith('say hello scriptalert1script');
  });

  it('空メッセージの場合はエラーをスローする', async () => {
    await expect(sendMessage('default', '<>{}[]')).rejects.toThrow(
      'メッセージが空か、無効な文字のみで構成されています'
    );
  });

  it('日本語メッセージを許可する', async () => {
    await sendMessage('default', 'こんにちは世界');

    expect(mockSend).toHaveBeenCalledWith('say こんにちは世界');
  });
});

describe('executeConsoleCommand', () => {
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupRunningServerMocks();
    mockSend = vi.fn().mockResolvedValue('');
    mockedRconConnect.mockResolvedValue({
      send: mockSend,
      end: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('許可されたコマンドを実行する', async () => {
    await executeConsoleCommand('default', 'list');

    expect(mockSend).toHaveBeenCalledWith('list');
  });

  it('先頭のスラッシュを除去する', async () => {
    await executeConsoleCommand('default', '/list');

    expect(mockSend).toHaveBeenCalledWith('list');
  });

  it('許可されていないコマンドはエラーをスローする', async () => {
    await expect(executeConsoleCommand('default', 'stop')).rejects.toThrow('許可されていません');
  });

  it('空コマンドはエラーをスローする', async () => {
    await expect(executeConsoleCommand('default', '  ')).rejects.toThrow('コマンドが空です');
  });

  it('制御文字を除去する', async () => {
    await executeConsoleCommand('default', 'list\n\rop attacker');

    expect(mockSend).toHaveBeenCalledWith('listop attacker');
  });
});

describe('banPlayer', () => {
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupRunningServerMocks();
    mockSend = vi.fn().mockResolvedValue('');
    mockedRconConnect.mockResolvedValue({
      send: mockSend,
      end: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('reasonなしでbanする', async () => {
    await banPlayer('default', 'Steve');

    expect(mockSend).toHaveBeenCalledWith('ban Steve');
  });

  it('reasonありでbanする', async () => {
    await banPlayer('default', 'Steve', 'griefing');

    expect(mockSend).toHaveBeenCalledWith('ban Steve griefing');
  });

  it('reasonから制御文字を除去する', async () => {
    await banPlayer('default', 'Steve', 'bad\nbehavior\r');

    expect(mockSend).toHaveBeenCalledWith('ban Steve badbehavior');
  });

  it('不正なプレイヤー名はエラーをスローする', async () => {
    await expect(banPlayer('default', '../etc')).rejects.toThrow('プレイヤー名の形式が無効です');
  });
});

describe('kickPlayer', () => {
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupRunningServerMocks();
    mockSend = vi.fn().mockResolvedValue('');
    mockedRconConnect.mockResolvedValue({
      send: mockSend,
      end: vi.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('reasonなしでkickする', async () => {
    await kickPlayer('default', 'Steve');

    expect(mockSend).toHaveBeenCalledWith('kick Steve');
  });

  it('reasonから制御文字を除去する', async () => {
    await kickPlayer('default', 'Steve', 'spam\x00\x1f');

    expect(mockSend).toHaveBeenCalledWith('kick Steve spam');
  });
});

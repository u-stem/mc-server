# 開発ガイド

このプロジェクトの開発環境セットアップと開発手順です。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16, React 19, Tailwind CSS |
| ランタイム | Bun |
| バックエンド | Next.js API Routes |
| コンテナ | Docker, Docker Compose |
| ユニットテスト | Vitest |
| E2E テスト | Playwright |
| リンター / フォーマッター | Biome |
| Git フック | lefthook |
| Minecraft サーバー | [itzg/minecraft-server](https://github.com/itzg/docker-minecraft-server) |

---

## 開発環境のセットアップ

### 前提条件

- Bun: JavaScript ランタイム
- Docker: OrbStack（macOS）または Docker Desktop

### 1. Bun のインストール

#### macOS

```bash
brew install oven-sh/bun/bun
```

#### Windows

```powershell
irm bun.sh/install.ps1 | iex
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. 開発サーバーの起動

```bash
bun run dev
```

http://localhost:3000 で開発サーバーにアクセスできます。

---

## 開発コマンド

プロジェクトルートまたは `web/` ディレクトリで実行できます。

```bash
# 開発サーバー起動（ホットリロード有効）
bun run dev

# プロダクションビルド
bun run build

# プロダクションサーバー起動
bun run start

# Biome でリント
bun run lint

# Biome でチェック（リント + フォーマット）
bun run check

# Biome で自動修正
bun run fix

# Biome でフォーマット
bun run fmt

# テスト実行（ウォッチモード）
bun run test

# テスト実行（1回のみ）
bun run test:run
```

---

## プロジェクト構成

```
mc-server/
├── web/                          # Web UI アプリケーション
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── api/              # API Routes
│   │   │   │   ├── servers/      # サーバー管理 API
│   │   │   │   └── tailscale/    # Tailscale API
│   │   │   ├── servers/          # サーバー詳細ページ
│   │   │   └── page.tsx          # トップページ
│   │   ├── components/           # React コンポーネント
│   │   │   ├── Alert.tsx         # アラート表示
│   │   │   ├── Button.tsx        # ボタン
│   │   │   ├── Card.tsx          # カード
│   │   │   ├── EmptyState.tsx    # 空状態表示
│   │   │   ├── Icons.tsx         # アイコン（lucide-react）
│   │   │   ├── Spinner.tsx       # ローディングスピナー
│   │   │   ├── ConfirmDialog.tsx # 確認ダイアログ
│   │   │   └── ...               # 機能別コンポーネント
│   │   ├── lib/                  # ユーティリティ
│   │   │   ├── constants.ts      # 共通定数
│   │   │   ├── messages.ts       # UIメッセージ定数
│   │   │   ├── config.ts         # サーバー設定管理
│   │   │   ├── docker.ts         # Docker 操作
│   │   │   ├── validation.ts     # 入力検証
│   │   │   ├── utils.ts          # ユーティリティ関数
│   │   │   ├── logger.ts         # ロガー（ログレベル制御）
│   │   │   ├── pluginCatalog.ts  # Modrinthプラグインカタログ
│   │   │   └── *.test.ts         # テストファイル
│   │   ├── hooks/                # カスタムフック
│   │   │   └── useTailscaleIp.ts # Tailscale IP取得フック
│   │   └── types/                # TypeScript 型定義
│   │       ├── server.ts         # サーバー関連の型
│   │       ├── api.ts            # API 関連の型
│   │       ├── plugin.ts         # プラグイン / Mod の型
│   │       ├── properties.ts     # プロパティ定義
│   │       ├── presets.ts        # プリセット定義
│   │       └── index.ts          # re-export
│   ├── Dockerfile                # 本番用 Docker イメージ
│   └── package.json
├── servers/                      # サーバーデータ（自動生成）
├── docker-compose.admin.yml      # 管理画面用 Docker Compose
└── scripts/                      # 起動・停止スクリプト
    ├── start.sh / start.ps1
    └── stop.sh / stop.ps1
```

---

## API エンドポイント

### サーバー管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/servers` | サーバー一覧取得 |
| POST | `/api/servers` | サーバー作成 |
| GET | `/api/servers/[id]` | サーバー詳細取得 |
| PUT | `/api/servers/[id]` | サーバー設定更新 |
| DELETE | `/api/servers/[id]` | サーバー削除 |
| POST | `/api/servers/[id]/start` | サーバー起動 |
| POST | `/api/servers/[id]/stop` | サーバー停止 |
| GET | `/api/servers/[id]/status` | ステータス取得 |
| GET | `/api/servers/[id]/logs` | ログ取得 |
| POST | `/api/servers/[id]/command` | コマンド実行 |

### プレイヤー管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/servers/[id]/whitelist` | ホワイトリスト取得 |
| POST | `/api/servers/[id]/whitelist` | プレイヤー追加 |
| DELETE | `/api/servers/[id]/whitelist/[name]` | プレイヤー削除 |

### Mod / プラグイン

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/servers/[id]/mods` | Mod 一覧取得 |
| POST | `/api/servers/[id]/mods` | Mod アップロード |
| DELETE | `/api/servers/[id]/mods/[filename]` | Mod 削除 |
| GET | `/api/servers/[id]/plugins` | プラグイン一覧取得 |
| POST | `/api/servers/[id]/plugins` | プラグインアップロード |
| DELETE | `/api/servers/[id]/plugins/[filename]` | プラグイン削除 |
| POST | `/api/servers/[id]/plugins/install` | おすすめプラグインインストール |

### バックアップ

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/servers/[id]/backups` | バックアップ一覧 |
| POST | `/api/servers/[id]/backups` | バックアップ作成 |
| POST | `/api/servers/[id]/backups/[backupId]` | バックアップ復元 |
| DELETE | `/api/servers/[id]/backups/[backupId]` | バックアップ削除 |

### その他

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/tailscale` | Tailscale IP 取得 |
| GET | `/api/servers/[id]/properties` | server.properties 取得 |
| PUT | `/api/servers/[id]/properties` | server.properties 更新 |

---

## Docker 環境

### 開発時の Docker 操作

管理画面は Docker 内から Docker を操作します（Docker-in-Docker ではなく、ホストの Docker ソケットをマウント）。

```yaml
# docker-compose.admin.yml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

### Minecraft サーバーの Docker Compose

各サーバーは `servers/<server-id>/docker-compose.yml` で管理されます。

```yaml
services:
  mc:
    image: itzg/minecraft-server
    container_name: mc-<server-id>
    ports:
      - "<port>:25565"
    volumes:
      - ./data:/data
    environment:
      EULA: "TRUE"
      TYPE: "PAPER"
      VERSION: "1.21.1"
      # ... その他の設定
```

---

## 本番ビルド

### Docker イメージのビルド

```bash
docker compose -f docker-compose.admin.yml build
```

### イメージの構成

`web/Dockerfile` は multi-stage build を使用：

1. builder: Bun で依存関係をインストールし、Next.js をビルド
2. runner: 軽量な Bun イメージで実行

```dockerfile
# Build stage
FROM oven/bun:1 AS builder
# ... ビルド処理

# Production stage
FROM oven/bun:1-slim AS runner
# Docker CLI と Compose プラグインをインストール
# ビルド成果物をコピー
```

---

## 環境変数

### Docker 環境（docker-compose.admin.yml）

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `HOST_PROJECT_ROOT` | ホスト上のプロジェクトパス | `.`（カレントディレクトリ） |
| `TAILSCALE_IP` | Tailscale IP アドレス | 空（自動取得試行） |
| `NODE_ENV` | 実行環境 | `production` |
| `PROJECT_ROOT` | コンテナ内のプロジェクトパス | `/app` |

### 開発環境

| 変数 | 説明 |
|------|------|
| `NODE_ENV` | `development` で開発モード |

---

## テスト

Vitest を使用してユニットテストを実行します。

```bash
# ウォッチモードで実行
bun run test

# 1回のみ実行
bun run test:run
```

テストファイルは各モジュールと同じディレクトリに `*.test.ts` として配置しています。

```
web/src/
├── lib/
│   ├── validation.test.ts       # バリデーション関数のテスト
│   ├── utils.test.ts            # ユーティリティ関数のテスト
│   ├── config.test.ts           # 設定管理関数のテスト
│   ├── docker.test.ts           # Docker関連関数のテスト
│   ├── mods.test.ts             # Mod管理関数のテスト
│   ├── plugins.test.ts          # プラグイン管理関数のテスト
│   ├── serverProperties.test.ts # server.properties関連のテスト
│   ├── logger.test.ts           # ロガーのテスト
│   └── pluginCatalog.test.ts    # プラグインカタログのテスト
└── types/
    ├── server.test.ts           # サーバー型・関数のテスト
    └── presets.test.ts          # プリセット関数のテスト
```

### E2E テスト

Playwright を使用してブラウザでのE2Eテストを実行します。

```bash
# ヘッドレスで実行
bun run test:e2e

# UI モードで実行（デバッグに便利）
bun run test:e2e:ui
```

E2E テストは `web/e2e/` ディレクトリに配置しています。

```
web/e2e/
├── home.test.ts           # ホームページのテスト
├── servers-new.test.ts    # 新規サーバー作成ページのテスト
├── servers-detail.test.ts # サーバー詳細ページのテスト
└── servers-edit.test.ts   # サーバー編集ページのテスト
```

### 手動テスト

自動テストでカバーできない機能は手動で確認します。

1. 開発サーバーを起動
2. サーバーの作成・起動・停止が動作するか確認
3. Mod / プラグインのアップロードが動作するか確認
4. バックアップの作成・復元が動作するか確認

---

## ロガー

`console.log` の代わりに `logger` を使用してください。本番環境では自動的にログレベルが調整されます。

```typescript
import { logger, setLogLevel, LogLevel } from '@/lib/logger';

// ログ出力
logger.debug('詳細なデバッグ情報');  // 開発時のみ出力
logger.info('通常の情報');           // 開発時のみ出力
logger.warn('警告');                 // 常に出力
logger.error('エラー');              // 常に出力

// ログレベル変更（テスト時など）
setLogLevel(LogLevel.OFF);  // ログを完全に無効化
```

| 環境 | デフォルトログレベル |
|------|---------------------|
| 開発 (`NODE_ENV=development`) | DEBUG（すべて出力） |
| 本番 (`NODE_ENV=production`) | WARN（警告・エラーのみ） |

---

## コーディング規約

- TypeScript: 厳格な型チェックを有効化
- Biome: リンター / フォーマッター（設定は `web/biome.json`）

### ファイル命名規則

- コンポーネント: PascalCase（`ServerCard.tsx`）
- ユーティリティ: camelCase（`config.ts`）
- テストファイル: `*.test.ts`（対象ファイルと同じディレクトリ）
- API Routes: kebab-case ディレクトリ構成

### コミットメッセージ

```
<type>: <subject>

<body>
```

type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## Git フック（lefthook）

lefthook を使って、コミット前に自動でチェックを実行します。

### セットアップ

`bun install` を実行すると自動的にセットアップされます。手動でセットアップする場合：

```bash
npx lefthook install
```

### 実行されるチェック

| フック | コマンド | 説明 |
|-------|---------|------|
| pre-commit | `bun run check` | Biome でリント・フォーマットチェック |
| pre-commit | `bun run test:run` | テスト実行 |
| pre-push | `bun run build` | ビルド確認 |

### スキップ方法

緊急時にフックをスキップする場合：

```bash
git commit --no-verify -m "message"
git push --no-verify
```

---

## トラブルシューティング（開発）

### Docker ソケットにアクセスできない

`docker-compose.admin.yml` で `group_add: [root]` を設定してあります。
それでも動かない場合は Docker ソケットのパーミッションを確認してください。

```bash
ls -la /var/run/docker.sock
```

### `docker compose` が見つからない

コンテナ内では Docker Compose V2 プラグインが必要です。
Dockerfile で `docker-compose-plugin` をインストールしています。

### Tailscale IP が取得できない

Docker 環境では `TAILSCALE_IP` 環境変数で渡す必要があります。
`scripts/start.sh` / `scripts/start.ps1` を使えば自動的に設定されます。

### ホットリロードが効かない

開発時は `bun run dev` を使用してください。Docker での開発はホットリロードが効きません。

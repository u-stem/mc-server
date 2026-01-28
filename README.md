# Minecraft Server Manager

Minecraft サーバーを簡単に管理できる Web UI ツールです。
Java版と統合版（Bedrock Edition）の両方に対応しています。

- Docker でサーバーを起動・停止・管理
- Tailscale で安全にゲストを招待（ポート開放不要）
- Mod / プラグイン管理、バックアップ、ホワイトリスト管理
- GeyserMC によるクロスプレイ対応（Java版サーバーに統合版から接続）

## 対応環境

| OS | Docker 環境 |
|----|-------------|
| macOS | OrbStack（推奨）/ Docker Desktop |
| Windows | Docker Desktop |

---

## クイックスタート

### 1. 前提条件

以下がインストールされていることを確認してください：

- Docker: [OrbStack](https://orbstack.dev/)（macOS）または [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Tailscale（任意）: ゲストを招待する場合に必要 - [ダウンロード](https://tailscale.com/download)

### 2. 起動

#### macOS / Linux

```bash
./scripts/start.sh
```

#### Windows（PowerShell）

```powershell
.\scripts\start.ps1
```

### 3. アクセス

ブラウザで http://localhost:3000 を開いて管理画面にアクセスします。

### 4. 停止

#### macOS / Linux

```bash
./scripts/stop.sh
```

#### Windows（PowerShell）

```powershell
.\scripts\stop.ps1
```

### 5. 削除（アンインストール）

管理画面のコンテナとイメージを完全に削除します。

#### macOS / Linux

```bash
./scripts/clean.sh
```

#### Windows（PowerShell）

```powershell
.\scripts\clean.ps1
```

---

## 使い方

### サーバーの作成

1. 管理画面で「新規作成」をクリック
2. サーバー名、バージョン、サーバータイプを設定
3. プリセット（バランス / 軽量 / クリエイティブ等）を選択
4. 「作成」をクリック

### サーバーの起動・停止

サーバー詳細画面の「起動」「停止」ボタンで操作できます。

### ゲストを招待する

Tailscale を使って安全にゲストを招待できます。

1. Tailscale にログイン: https://login.tailscale.com/admin
2. ゲストを招待: Users → Invite users → メールアドレスを入力
3. ゲストに接続情報を伝える:
   - サーバーアドレス: `<ホストのTailscale IP>:25565`
   - Tailscale IP は管理画面の「概要」タブで確認できます

ゲスト側の設定は [ゲスト向け導入手順](docs/client-setup.md) を参照してください。

---

## 管理画面の機能

| タブ | 機能 |
|------|------|
| 概要 | 接続情報、プレイヤー数、リソース使用状況 |
| コンソール | サーバーログの確認、コマンド実行 |
| プレイヤー | ホワイトリスト管理 |
| Mod / プラグイン | アップロード、有効/無効切り替え |
| バックアップ | ワールドデータのバックアップ・復元 |
| 設定 | サーバー設定の変更 |
| ヘルプ | コマンドリファレンス、接続手順 |

### 対応サーバータイプ

#### Java版

| カテゴリ | サーバータイプ |
|---------|---------------|
| バニラ | Vanilla |
| Mod サーバー | Fabric, Forge, NeoForge, Quilt |
| プラグインサーバー | Spigot, Paper, Purpur, Folia |
| ハイブリッド | Mohist, Arclight, CatServer |

#### 統合版（Bedrock Edition）

| カテゴリ | サーバータイプ |
|---------|---------------|
| 統合版 | Bedrock |

> **クロスプレイについて**: Java版サーバーに GeyserMC プラグインをインストールすると、統合版プレイヤーも参加できます。詳しくは [クロスプレイガイド](docs/crossplay.md) を参照してください。

---

## ディレクトリ構成

```
mc-server/
├── scripts/               # スクリプト
│   ├── start.sh / start.ps1   # 起動
│   ├── stop.sh / stop.ps1     # 停止
│   └── clean.sh / clean.ps1   # 削除
├── docker-compose.admin.yml  # 管理画面の Docker Compose
├── servers/               # サーバーデータ（自動生成）
│   ├── config.json        # サーバー一覧設定
│   └── <server-id>/       # 各サーバーのデータ
│       ├── docker-compose.yml
│       ├── data/          # ワールド、mods 等
│       └── backups/       # バックアップ
├── web/                   # 管理用 Web UI（Next.js）
└── docs/                  # ドキュメント
```

---

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [ゲスト向け導入手順](docs/client-setup.md) | ゲストがサーバーに接続するための手順 |
| [クロスプレイガイド](docs/crossplay.md) | Java版と統合版のクロスプレイ設定 |
| [Mod / プラグイン一覧](docs/mods-list.md) | おすすめ Mod・プラグインと追加方法 |
| [トラブルシューティング](docs/troubleshoot.md) | よくある問題と解決方法 |
| [開発ガイド](docs/development.md) | 開発者向けセットアップ手順 |

---

## トラブルシューティング

### サーバーが起動しない

```bash
# コンテナのログを確認
docker logs mc-<server-id>
```

### Tailscale で接続できない

1. Tailscale アプリが起動しているか確認
2. ファイアウォールの設定を確認
   - macOS: システム設定 → ネットワーク → ファイアウォール
   - Windows: Windows セキュリティ → ファイアウォール
3. ゲストが同じ Tailnet にいるか確認: https://login.tailscale.com/admin/machines

詳細は [トラブルシューティング](docs/troubleshoot.md) を参照してください。

---

## ライセンス

MIT License

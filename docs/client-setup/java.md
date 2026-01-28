# Java版（Windows / Mac）

Java Edition でサーバーに接続する手順です。

## 必要なもの

- Minecraft Java Edition（正規アカウント）
- Tailscale（無料）

## 手順

### 1. Tailscale をインストール

Tailscale はVPNアプリです。これを使うことでポート開放なしで安全に接続できます。

1. https://tailscale.com/download にアクセス
2. お使いのOS（Windows / Mac）版をダウンロード・インストール
3. アプリを起動してログイン（Google / Microsoft / GitHub アカウントで可）

### 2. ホストからの招待を承諾

ホストから招待メールが届きます。

1. メール内の招待リンクをクリック
2. 「Accept invite」をクリックして招待を承諾
3. Tailscale アプリで接続状態が「Connected」になっていることを確認

### 3. 接続テスト

Tailscale が正しく接続できているか確認します。

Windows（コマンドプロンプト または PowerShell）:
```cmd
ping <サーバーのTailscale IP>
```

Mac（ターミナル）:
```bash
ping <サーバーのTailscale IP>
```

応答があれば接続成功です。

### 4. Minecraft ランチャーの準備

#### Prism Launcher を使う場合（推奨）

Prism Launcher を使うとMod管理が簡単です。

1. https://prismlauncher.org/ からダウンロード・インストール
2. Prism Launcher を起動し、Minecraft アカウントでログイン
3. 「インスタンスを追加」から新規作成
4. ホストから指定されたバージョンとローダー（Fabric / Forge / Paper等）を選択

#### 公式ランチャーを使う場合

1. Minecraft Launcher を起動
2. 「起動構成」から新しい構成を作成
3. ホストから指定されたバージョンを選択

Modサーバーの場合は、対応するローダー（Fabric等）のインストールが必要です。

### 5. サーバーに接続

1. Minecraft を起動
2. 「マルチプレイ」→「サーバーを追加」
3. サーバーアドレスを入力:
   ```
   <サーバーのTailscale IP>:<ポート番号>
   ```
   例: `100.64.0.1:25565`
4. 「完了」→ サーバーを選択して「サーバーに接続」

## 接続情報

ホストから以下の情報を受け取ってください:

| 項目 | 確認内容 |
|------|----------|
| Tailscale IP | 100.x.x.x 形式のIPアドレス |
| ポート番号 | 通常は 25565 |
| Minecraft バージョン | 1.21.1 など |
| ローダー | Vanilla / Fabric / Forge / Paper など |
| 必要なMod | Modサーバーの場合 |

## トラブルシューティング

### ping が通らない

- Tailscale アプリが起動しているか確認
- Tailscale の接続状態が「Connected」になっているか確認
- 招待を承諾したか確認（メールのリンクをクリック）

### 「接続できませんでした」と表示される

- サーバーが起動しているかホストに確認
- Minecraft のバージョンが合っているか確認
- ポート番号が正しいか確認

### 「サーバーへの接続に失敗しました」と表示される

- ホワイトリストに追加されているかホストに確認
- プレイヤー名（Minecraft ID）が正しく登録されているか確認

### Mod が合わない

- サーバーと同じバージョンのModを使用しているか確認
- 必要なModが全て入っているか確認
- 不要なModが入っていないか確認

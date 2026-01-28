# ゲスト向け導入手順

Minecraftサーバーに接続するための手順です。
Java版と統合版（Bedrock Edition）の両方に対応しています。

---

## 目次

- [Java版で接続する](#java版で接続する)
- [統合版で接続する](#統合版で接続する)

---

## Java版で接続する

### 必要なもの

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

- サーバーが起動しているか管理者に確認
- Minecraft のバージョンが合っているか確認
- ポート番号が正しいか確認

### 「サーバーへの接続に失敗しました」と表示される

- ホワイトリストに追加されているか管理者に確認
- プレイヤー名（Minecraft ID）が正しく登録されているか確認

### Mod が合わない

- サーバーと同じバージョンのModを使用しているか確認
- 必要なModが全て入っているか確認
- 不要なModが入っていないか確認

---

## 統合版で接続する

統合版（Bedrock Edition）からの接続方法です。
Bedrock専用サーバー、または GeyserMC が有効な Java版サーバーに接続できます。

### 必要なもの

- Minecraft 統合版（iOS / Android / Switch / Xbox / PlayStation / Windows）
- Tailscale（無料）- 外部ネットワークから接続する場合

### 対応デバイス

- スマートフォン / タブレット（iOS / Android）
- Nintendo Switch
- Xbox
- PlayStation
- Windows 10/11（Bedrock版）

### 1. Tailscale をインストール（外部接続の場合）

同じネットワーク内にいない場合は Tailscale が必要です。

- iOS: App Store で「Tailscale」を検索
- Android: Google Play で「Tailscale」を検索
- Windows: https://tailscale.com/download

インストール後、管理者から送られた招待メールのリンクをタップして承諾してください。

### 2. サーバーに接続

#### スマートフォン / タブレット

1. Minecraft を起動し「遊ぶ」をタップ
2. 「サーバー」タブを選択
3. 「サーバーを追加」をタップ
4. サーバー情報を入力:
   - サーバー名: 任意の名前
   - サーバーアドレス: `<サーバーのIP>`
   - ポート: `19132`（またはホストから指定されたポート）
5. 「保存」してサーバーを選択

#### Windows 10/11（Bedrock版）

1. Minecraft を起動し「遊ぶ」をクリック
2. 「サーバー」タブを選択
3. 「サーバーを追加」をクリック
4. サーバー情報を入力
5. 「保存」して接続

#### Nintendo Switch / Xbox / PlayStation

コンソール版では外部サーバーへの直接接続がネイティブでサポートされていません。
**BedrockConnect** というツールを使用することで、任意の外部サーバーに接続できます。

> **注意**: この方法は非公式な手段です。将来的な仕様変更により使用できなくなる可能性があります。

##### BedrockConnect とは

BedrockConnect は、コンソール版 Minecraft で「特集サーバー」画面を経由して任意のサーバーに接続できるようにするツールです。DNS を変更することで、特集サーバーへの接続を BedrockConnect のサーバーリスト画面にリダイレクトします。

詳細: [BedrockConnect GitHub](https://github.com/Pugmatt/BedrockConnect)

##### Nintendo Switch での設定手順

1. **ホーム画面**から「設定」を開く
2. 「インターネット」→「インターネット設定」を選択
3. 接続中のネットワークを選択し「設定の変更」
4. 「DNS設定」を「手動」に変更
5. 以下を入力:
   - **優先DNS**: `104.238.130.180`（BedrockConnect サーバー）
   - **代替DNS**: `8.8.8.8`（Google DNS）
6. 「保存する」を選択

##### PlayStation での設定手順

1. 「設定」→「ネットワーク」→「インターネット接続を設定する」
2. 接続方法を選択（Wi-Fi または LAN）
3. 「カスタム」を選択
4. IPアドレス設定は「自動」
5. DHCPホスト名は「指定しない」
6. DNS設定を「手動」にして以下を入力:
   - **プライマリDNS**: `104.238.130.180`
   - **セカンダリDNS**: `8.8.8.8`
7. その他の設定はデフォルトのまま進めて完了

##### Xbox での設定手順

1. 「設定」→「一般」→「ネットワーク設定」→「詳細設定」
2. 「DNS設定」を選択し「手動」に変更
3. 以下を入力:
   - **プライマリDNS**: `104.238.130.180`
   - **セカンダリDNS**: `8.8.8.8`

##### サーバーへの接続

1. Minecraft を起動
2. 「遊ぶ」→「サーバー」タブを選択
3. 任意の特集サーバー（Hive など）を選択して接続
4. BedrockConnect のメニュー画面が表示される
5. 「Connect to a Server」を選択
6. サーバー情報を入力:
   - **Server Address**: サーバーの IP アドレス（Tailscale IP など）
   - **Server Port**: `19132`（またはホストから指定されたポート）
7. 「Add to server list」にチェックを入れると次回から入力不要
8. 「Submit」で接続

##### 代替 DNS サーバー

メインの DNS サーバーに接続できない場合は、以下を試してください:
- `45.55.68.52`
- その他のサーバーは [BedrockConnect GitHub](https://github.com/Pugmatt/BedrockConnect) で確認

##### BedrockTogether（PlayStation 向け代替方法）

スマートフォンアプリ「BedrockTogether」を使う方法もあります:

1. スマートフォンに BedrockTogether アプリをインストール
2. PlayStation と同じ Wi-Fi に接続
3. アプリでサーバー情報を入力
4. Minecraft の「フレンド」タブに LAN ゲームとして表示される

##### 注意事項

- DNS 設定を変更しても、他のゲームやアプリには影響しません（代替DNS として Google DNS を設定しているため）
- 長期間 Minecraft をプレイしない場合は、DNS 設定を元に戻すことを推奨します
- IPv6 環境では BedrockConnect が動作しない場合があります

### 接続情報（統合版）

ホストから以下の情報を受け取ってください:

| 項目 | 確認内容 |
|------|----------|
| サーバーアドレス | IP アドレスまたは Tailscale IP |
| ポート番号 | 通常は 19132（UDP） |
| サーバータイプ | Bedrock専用 または GeyserMC（Java版） |

### トラブルシューティング（統合版）

#### 接続できない

- サーバーが起動しているか管理者に確認
- ポート番号が正しいか確認（デフォルト: 19132）
- Tailscale が「Connected」になっているか確認

#### 「世界に接続できませんでした」と表示される

- サーバーアドレスとポートが正しいか確認
- UDP 通信が許可されているか確認
- コンソール版の場合、外部サーバーへの接続制限がある可能性があります

#### GeyserMC サーバーでログインできない

- Floodgate 使用時は、プレイヤー名の前にプレフィックス（通常 `.`）が必要な場合があります
- ホワイトリストに `.あなたの名前` の形式で登録されているか確認してください

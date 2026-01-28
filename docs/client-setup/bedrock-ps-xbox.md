# 統合版（PlayStation / Xbox）

PlayStation、Xbox からサーバーに接続する手順です。

## 制限事項

PlayStation / Xbox では以下の制限があります:

- 外部サーバーへの直接接続がネイティブでサポートされていない
- Tailscale をインストールできない

接続方法は2つあります:

| 方法 | 概要 | 必要なもの |
|------|------|-----------|
| BedrockConnect（DNS方式） | DNSを変更して特集サーバー経由で接続 | なし |
| BedrockTogether（アプリ中継） | スマホアプリ経由でLANゲームとして接続 | スマートフォン |

> 注意: これらの方法は非公式な手段です。将来的な仕様変更により使用できなくなる可能性があります。

---

## 方法1: BedrockConnect（DNS方式）

DNSを変更して「特集サーバー」経由で接続する方法です。

### BedrockConnect とは

BedrockConnect は、「特集サーバー」画面を経由して任意のサーバーに接続できるようにするツールです。

詳細: [BedrockConnect GitHub](https://github.com/Pugmatt/BedrockConnect)

### PlayStation での DNS設定

1. 「設定」→「ネットワーク」→「インターネット接続を設定する」
2. 接続方法を選択（Wi-Fi または LAN）
3. 「カスタム」を選択
4. IPアドレス設定は「自動」
5. DHCPホスト名は「指定しない」
6. DNS設定を「手動」にして以下を入力:
   - プライマリDNS: `104.238.130.180`
   - セカンダリDNS: `8.8.8.8`
7. その他の設定はデフォルトのまま進めて完了

### Xbox での DNS設定

1. 「設定」→「一般」→「ネットワーク設定」→「詳細設定」
2. 「DNS設定」を選択し「手動」に変更
3. 以下を入力:
   - プライマリDNS: `104.238.130.180`
   - セカンダリDNS: `8.8.8.8`

### サーバーに接続

1. Minecraft を起動
2. 「遊ぶ」→「サーバー」タブを選択
3. 任意の特集サーバー（Hive など）を選択して接続
4. BedrockConnect のメニュー画面が表示される
5. 「Connect to a Server」を選択
6. サーバー情報を入力:
   - Server Address: サーバーの IP アドレス
   - Server Port: `19132`（またはホストから指定されたポート）
7. 「Add to server list」にチェックを入れると次回から入力不要
8. 「Submit」で接続

### 代替 DNS サーバー

メインの DNS サーバーに接続できない場合は、以下を試してください:

- `45.55.68.52`
- その他のサーバーは [BedrockConnect GitHub](https://github.com/Pugmatt/BedrockConnect) で確認

---

## 方法2: BedrockTogether（アプリ中継）

スマートフォンアプリを使って、サーバーを LAN ゲームとして表示させる方法です。
外部ネットワークからの接続にはこちらを推奨します。

### 必要なもの

- スマートフォン（iOS または Android）
- Tailscale アプリ（外部ネットワークの場合）
- BedrockTogether アプリ

### 仕組み

```
PlayStation / Xbox
    ↓ 同じWi-Fi
スマートフォン（Tailscale + BedrockTogether）
    ↓ Tailscale VPN
サーバー
```

スマートフォンが「Tailscale経由のサーバー」を「ローカルLANのゲーム」としてコンソールに見せます。

### 手順

#### 1. スマートフォンにアプリをインストール

Tailscale:
- iOS: App Store で「Tailscale」を検索
- Android: Google Play で「Tailscale」を検索

BedrockTogether:
- iOS: [App Store](https://apps.apple.com/us/app/bedrocktogether/id1534593376)
- Android: [Google Play](https://play.google.com/store/apps/details?id=pl.extollite.bedrocktogetherapp) または [APKPure](https://apkpure.com/bedrocktogether/pl.extollite.bedrocktogetherapp)

#### 2. Tailscale に接続（外部ネットワークの場合）

1. ホストから招待メールが届く
2. メール内の招待リンクをタップして承諾
3. Tailscale アプリで接続状態が「Connected」になっていることを確認

#### 3. BedrockTogether を設定

1. BedrockTogether アプリを起動
2. サーバー情報を入力:
   - Server IP: サーバーの IP アドレス（Tailscale IP など）
   - Server Port: `19132`（またはホストから指定されたポート）
3. 「Run」をタップ

#### 4. コンソールで接続

1. PlayStation / Xbox がスマートフォンと同じ Wi-Fi に接続していることを確認
2. Minecraft を起動
3. 「遊ぶ」→「フレンド」タブを選択
4. 「LANゲーム」としてサーバーが表示される
5. 選択して接続

#### 5. 接続後

接続が完了したら、BedrockTogether アプリは閉じても大丈夫です。

---

## 接続情報

ホストから以下の情報を受け取ってください:

| 項目 | 確認内容 |
|------|----------|
| サーバーアドレス | ローカルIP または Tailscale IP |
| ポート番号 | 通常は 19132（UDP） |
| サーバータイプ | Bedrock専用 または GeyserMC（Java版） |

## トラブルシューティング

### BedrockConnect の画面が表示されない

- DNS設定が正しく保存されているか確認
- インターネット接続を一度切断して再接続
- 代替DNSサーバーを試す

### BedrockTogether で LAN ゲームが表示されない

- スマートフォンとコンソールが同じ Wi-Fi に接続しているか確認
- BedrockTogether アプリが「Running」状態か確認
- Wi-Fi のクライアント分離（AP Isolation）が無効になっているか確認

### サーバーに接続できない

- サーバーアドレスとポートが正しいか確認
- サーバーが起動しているかホストに確認

### 「世界に接続できませんでした」と表示される

- サーバーアドレスとポートを再確認
- 時間をおいて再試行

### GeyserMC サーバーでログインできない

- Floodgate 使用時は、プレイヤー名の前にプレフィックス（通常 `.`）が必要な場合があります
- ホワイトリストに `.あなたの名前` の形式で登録されているか確認

## 注意事項

- DNS設定を変更しても、他のゲームやアプリには影響しません
- 長期間 Minecraft をプレイしない場合は、DNS設定を元に戻すことを推奨します
- IPv6 環境では BedrockConnect が動作しない場合があります
- BedrockTogether 経由の場合、若干のレイテンシ増加がありますが、通常のプレイには問題ありません

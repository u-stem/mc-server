# トラブルシューティング

よくある問題と解決方法をまとめています。

---

## 接続できない

### ping が通らない

原因: Tailscale の接続問題

確認事項:
1. Tailscale アプリが起動しているか
2. Tailscale で「Connected」になっているか
3. サーバー機が起動しているか

解決策:
- Tailscale を再起動
- ホストに共有設定（Share）を再確認してもらう
- ファイアウォールが Tailscale をブロックしていないか確認

### ping は通るが Minecraft で接続できない

原因: サーバーが起動していない、またはポートの問題

確認:
管理画面でサーバーのステータスを確認するか、以下のコマンドを実行：

```bash
docker ps | grep mc-
```

解決策:
- サーバーが停止していれば管理画面から起動
- `docker logs mc-<server-id>` でエラーを確認
- Docker が起動しているか確認

### 「サーバーが古い/新しい」と表示される

原因: Minecraft バージョン不一致

解決策:
- 管理画面でサーバーのバージョンを確認
- クライアントの Minecraft バージョンをサーバーに合わせる
- Mod サーバーの場合、対応するローダー（Fabric 等）も合わせる

---

## サーバーが起動しない

### Docker が起動していない

エラー: `Cannot connect to the Docker daemon`

解決策:
- OrbStack / Docker Desktop を起動する
- メニューバーのアイコンで状態を確認

### ポートが使用中

エラー: `Bind for 0.0.0.0:25565 failed: port is already allocated`

解決策:
```bash
# ポートを使用しているプロセスを確認
lsof -i :25565

# 古いコンテナが残っている場合
docker compose -f servers/<server-id>/docker-compose.yml down
```

または管理画面で別のポートを設定してください。

### 初回起動で止まる

症状: ログが進まない、`Downloading` で止まる

解決策:
- 初回はファイルダウンロードに時間がかかるので待つ（5〜10分程度）
- ネットワーク接続を確認
- 管理画面のコンソールタブでログを監視

---

## Mod / プラグイン関連

### Missing Mods エラー

原因: サーバーに必要な Mod がクライアントにない

解決策:
1. エラーメッセージで足りない Mod を確認
2. [Mod / プラグイン一覧](mods-list.md) と照合
3. 不足している Mod をインストール

### Mod の競合

症状: 起動時にクラッシュ、または特定の操作でクラッシュ

解決策:
1. 管理画面のコンソールでエラーログを確認
2. 最近追加した Mod を一つずつ無効化して原因特定
3. Mod の互換性情報を確認

### Fabric API がない

エラー: `Mod requires fabric-api`

解決策:
1. [Modrinth](https://modrinth.com/mod/fabric-api) から Fabric API をダウンロード
2. 管理画面の Mod タブからアップロード
3. サーバーを再起動

---

## パフォーマンス

### ラグい（サーバー側）

確認:
管理画面のコンソールで TPS（Ticks Per Second）を確認：
```
/spark tps
```

解決策:
- 管理画面の設定で `VIEW_DISTANCE` を下げる（10 → 8）
- `SIMULATION_DISTANCE` を下げる
- 不要な Mod / プラグインを無効化
- Spark プラグインでボトルネックを特定

### ラグい（クライアント側）

解決策:
- Sodium Mod を入れる（描画最適化）
- ビデオ設定で描画距離を下げる
- シェーダーを切る

### Mac がスリープして落ちる

解決策:
Docker が起動していれば基本的にスリープしませんが、念のため：

```bash
# スリープを防止（ターミナルを開いている間）
caffeinate -i
```

または「システム設定」→「ロック画面」→「ディスプレイがオフの時...」を「しない」に設定

---

## 管理画面の問題

### 管理画面が起動しない

確認:
```bash
docker ps | grep mc-admin
docker logs mc-admin
```

解決策:
```bash
# 再起動
./scripts/stop.sh
./scripts/start.sh
```

### サーバー起動ボタンを押してもエラーになる

よくある原因:
1. Docker ソケットへのアクセス権限がない
2. Docker Compose プラグインがない

解決策:
最新の起動スクリプトを使用してください：
```bash
./scripts/start.sh
```

### Tailscale IP が表示されない

原因: 環境変数が渡されていない

解決策:
`scripts/start.sh` / `scripts/start.ps1` を使って起動すると自動的に設定されます。

手動で起動する場合：
```bash
TAILSCALE_IP=$(tailscale ip -4) HOST_PROJECT_ROOT=$(pwd) docker compose -f docker-compose.admin.yml up -d
```

---

## Docker 関連

### コンテナを完全にリセット

```bash
# 停止して削除
docker compose -f servers/<server-id>/docker-compose.yml down

# イメージも削除（完全リセット）
docker compose -f servers/<server-id>/docker-compose.yml down --rmi all

# 管理画面から再度起動
```

### ディスク容量不足

```bash
# Docker の使用量を確認
docker system df

# 不要なイメージ・コンテナを削除
docker system prune
```

---

## オートメーション関連

### Discord通知が届かない

確認事項:
1. Webhook URL が正しいか
2. Discord サーバーの Webhook が有効か
3. 通知設定が有効になっているか

解決策:
1. 管理画面の「オートメーション」→「Discord通知」でテスト送信を実行
2. Webhook URL を再生成して設定し直す
3. Discord サーバーの「連携サービス」→「Webhooks」で確認

### 自動バックアップが実行されない

確認事項:
1. 自動バックアップが有効になっているか
2. スケジュール時刻が正しく設定されているか
3. 管理画面（mc-admin）が起動しているか

解決策:
```bash
# 管理画面のログを確認
docker logs mc-admin | grep -i backup
```

### ヘルスチェックが機能しない

確認事項:
1. ヘルスチェックが有効になっているか
2. サーバーが起動しているか
3. TPS/メモリの閾値が適切か

解決策:
- 閾値が厳しすぎる場合は緩和する（TPS: 15以下、メモリ: 90%以上）
- 再起動クールダウン時間を確認（デフォルト: 30分）

---

## ログの確認方法

### 管理画面から

1. サーバー詳細画面の「コンソール」タブを開く
2. リアルタイムでログが表示される

### コマンドラインから

```bash
# Minecraft サーバーのログ
docker logs mc-<server-id>

# リアルタイムで監視
docker logs -f mc-<server-id>

# 管理画面のログ
docker logs mc-admin
```

### ログファイル

サーバーのログファイルは以下に保存されます：
```
servers/<server-id>/data/logs/latest.log
```

---

## それでも解決しない場合

1. サーバーとクライアントの Minecraft バージョンが一致しているか再確認
2. サーバーとクライアントの Mod 構成が一致しているか再確認
3. 一度 Mod を全部外してバニラで接続できるか試す
4. コンテナを完全にリセットして再起動
5. 管理画面を再ビルド：
   ```bash
   docker compose -f docker-compose.admin.yml build --no-cache
   ./scripts/start.sh
   ```

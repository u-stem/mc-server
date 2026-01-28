# Mod / プラグイン 一覧

サーバとクライアントで使用する Mod・プラグインの一覧です。

## サーバータイプ別の対応

| サーバータイプ | Mod | プラグイン |
|---------------|-----|-----------|
| Fabric / Forge / NeoForge / Quilt | 対応 | 非対応 |
| Spigot / Paper / Purpur / Folia | 非対応 | 対応 |
| Mohist / Arclight / CatServer | 対応 | 対応 |
| Vanilla | 非対応 | 非対応 |

---

## Mod（Fabric サーバー向け）

### 必須 Mod

| Mod 名 | 用途 | クライアント必須 | ダウンロード |
|--------|------|------------------|--------------|
| Fabric API | Fabric Mod の前提 | はい | [Modrinth](https://modrinth.com/mod/fabric-api) |

### クライアント推奨 Mod

サーバ参加には不要ですが、入れると快適になる Mod です。

| Mod 名 | 用途 | ダウンロード |
|--------|------|--------------|
| Sodium | 描画パフォーマンス向上 | [Modrinth](https://modrinth.com/mod/sodium) |
| Lithium | サーバ/クライアント最適化 | [Modrinth](https://modrinth.com/mod/lithium) |
| ModMenu | Mod 設定画面 | [Modrinth](https://modrinth.com/mod/modmenu) |
| Iris | シェーダー対応 | [Modrinth](https://modrinth.com/mod/iris) |

### クライアント専用 Mod（影 Mod 等）

以下の Mod はクライアント側のみで動作し、サーバーにインストールする必要はありません。

| Mod 名 | 用途 | ダウンロード |
|--------|------|--------------|
| Iris | シェーダー（Fabric/Quilt） | [Modrinth](https://modrinth.com/mod/iris) |
| OptiFine | シェーダー + 最適化（Forge/Vanilla） | [公式サイト](https://optifine.net/) |
| Oculus | シェーダー（Forge、Iris移植版） | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/oculus) |

---

## プラグイン（Paper / Spigot サーバー向け）

### おすすめプラグイン

Web UI からワンクリックでインストールできます。

| プラグイン名 | 用途 | 主なコマンド | ドキュメント |
|-------------|------|-------------|--------------|
| Spark | パフォーマンス監視 | `/spark profiler`, `/spark tps` | [公式](https://spark.lucko.me/docs) |
| LuckPerms | 権限管理 | `/lp editor`, `/lp user <name> info` | [公式](https://luckperms.net/wiki) |
| Chunky | ワールド事前生成 | `/chunky start`, `/chunky radius <blocks>` | [GitHub](https://github.com/pop4959/Chunky/wiki) |

### プラグイン配布サイト

| サイト | URL |
|--------|-----|
| Hangar | https://hangar.papermc.io/ |
| SpigotMC | https://www.spigotmc.org/resources/ |
| Modrinth | https://modrinth.com/plugins |

---

## Mod / プラグイン追加時の注意

1. バージョン確認: Minecraft バージョンとローダー（Fabric / Paper 等）に対応しているか確認
2. 依存関係: 前提 Mod / プラグイン（Fabric API 等）を忘れずに入れる
3. サーバ/クライアント: 両方に必要か、片方だけでいいか確認
4. 互換性: 他の Mod / プラグインと競合しないか確認

## 追加方法

### Web UI から追加（推奨）

1. サーバー詳細画面の「Mod / プラグイン」タブを開く
2. .jar ファイルをドラッグ&ドロップ、またはアップロードボタンをクリック
3. サーバーを再起動して反映

### クライアント側への Mod 追加

Prism Launcher の場合：
1. インスタンスを右クリック → 「編集」
2. 「Mods」タブ → 「追加」
3. Mod ファイルを選択

手動の場合：
- Windows: `%appdata%\.minecraft\mods\` に配置
- Mac: `~/Library/Application Support/minecraft/mods/` に配置

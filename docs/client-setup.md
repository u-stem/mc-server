# ゲスト向け導入手順

Minecraftサーバーに接続するための手順です。
お使いのデバイスに合わせて、以下のページを参照してください。

## Java版

| デバイス | ページ |
|---------|--------|
| Windows / Mac | [Java版](./client-setup/java.md) |

## 統合版（Bedrock Edition）

| デバイス | ページ | 接続方法 |
|---------|--------|---------|
| iOS / Android / Windows | [統合版（直接接続）](./client-setup/bedrock-direct.md) | サーバー追加 + Tailscale |
| Nintendo Switch | [統合版（Switch）](./client-setup/bedrock-switch.md) | BedrockConnect（DNS方式） |
| PlayStation / Xbox | [統合版（PS/Xbox）](./client-setup/bedrock-ps-xbox.md) | BedrockConnect or BedrockTogether |

## 接続方法の比較

| 方法 | 対応デバイス | 必要なもの | 難易度 |
|------|-------------|-----------|--------|
| 直接接続 | iOS, Android, Windows | Tailscale | 簡単 |
| BedrockConnect | Switch, PS, Xbox | DNS設定の変更 | 普通 |
| BedrockTogether | PS, Xbox | スマートフォン + アプリ | 普通 |

## 共通の接続情報

ホストから以下の情報を受け取ってください:

| 項目 | Java版 | 統合版 |
|------|--------|--------|
| サーバーアドレス | Tailscale IP（100.x.x.x） | Tailscale IP または ローカルIP |
| ポート番号 | 25565 | 19132 |
| バージョン | 要確認 | 要確認 |

## 注意事項

- コンソール版（Switch/PS/Xbox）の BedrockConnect は非公式な手段です
- 将来的な仕様変更により使用できなくなる可能性があります
- 問題が発生した場合は、各ページのトラブルシューティングを参照してください

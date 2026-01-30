/**
 * APIエラーメッセージ定数
 *
 * 一貫性のあるエラーメッセージを提供するための定数定義
 * ※すべて日本語で統一
 */

// ============================================
// バリデーションエラー
// ============================================

// 無効なフォーマット
export const ERROR_INVALID_SERVER_ID = 'サーバーIDが無効です';
export const ERROR_INVALID_BACKUP_ID_FORMAT = 'バックアップIDの形式が無効です';
export const ERROR_INVALID_FILENAME_FORMAT = 'ファイル名の形式が無効です';
export const ERROR_INVALID_PLAYER_NAME_FORMAT = 'プレイヤー名の形式が無効です';
export const ERROR_INVALID_DISCORD_WEBHOOK_FORMAT = 'Discord Webhook URLの形式が無効です';
export const ERROR_INVALID_VERSION_FORMAT = 'バージョンは "1.21.1" の形式で指定してください';
export const ERROR_JAR_FILE_ONLY = '.jarファイルのみアップロード可能です';
export const ERROR_INVALID_ADDON_FILENAME = 'アドオンファイル名が無効です';
export const ERROR_UNSUPPORTED_ARCHIVE_FORMAT =
  '対応していないファイル形式です。.zip または .tar.gz を使用してください';

// 必須フィールド
export const ERROR_FILE_NOT_PROVIDED = 'ファイルが提供されていません';
export const ERROR_FILE_NOT_SPECIFIED = 'ファイルが指定されていません';
export const ERROR_COMMAND_REQUIRED = 'コマンドが必要です';
export const ERROR_PLUGIN_ID_REQUIRED = 'プラグインIDが必要です';
export const ERROR_WEBHOOK_URL_REQUIRED = 'Webhook URLが必要です';
export const ERROR_WEBHOOK_URL_REQUIRED_WHEN_ENABLED =
  'Discord通知を有効にする場合はWebhook URLが必要です';

// スケジュールバリデーション
export const ERROR_SCHEDULE_ENABLED_MUST_BE_BOOLEAN =
  'スケジュール設定: enabledはboolean型である必要があります';
export const ERROR_SCHEDULE_TIMEZONE_REQUIRED = 'スケジュール設定: タイムゾーンが必要です';
export const ERROR_SCHEDULE_WEEKLY_REQUIRED = 'スケジュール設定: 週次スケジュールが必要です';

// ファイルサイズ
export const ERROR_FILE_SIZE_EXCEEDS_LIMIT = 'ファイルサイズが上限（500MB）を超えています';
export const ERROR_FILE_SIZE_EXCEEDS_LIMIT_50MB = 'ファイルサイズが上限（50MB）を超えています';

// ============================================
// Not Found エラー
// ============================================

export const ERROR_SERVER_NOT_FOUND = 'サーバーが見つかりません';
export const ERROR_BACKUP_NOT_FOUND = 'バックアップが見つかりません';
export const ERROR_MOD_NOT_FOUND = 'Modが見つかりません';
export const ERROR_PLUGIN_NOT_FOUND = 'プラグインが見つかりません';
export const ERROR_PLUGIN_NOT_IN_RECOMMENDED = 'おすすめプラグイン一覧にありません';
export const ERROR_TAILSCALE_IP_NOT_FOUND = 'TailscaleのIPが見つかりません';
export const ERROR_TAILSCALE_NOT_CONNECTED = 'Tailscaleに接続されていません';

// ============================================
// 操作失敗エラー
// ============================================

// サーバー操作
export const ERROR_GET_SERVER_FAILED = 'サーバー情報の取得に失敗しました';
export const ERROR_GET_SERVERS_FAILED = 'サーバー一覧の取得に失敗しました';
export const ERROR_CREATE_SERVER_FAILED = 'サーバーの作成に失敗しました';
export const ERROR_UPDATE_SERVER_FAILED = 'サーバーの更新に失敗しました';
export const ERROR_DELETE_SERVER_FAILED = 'サーバーの削除に失敗しました';
export const ERROR_START_SERVER_FAILED = 'サーバーの起動に失敗しました';
export const ERROR_STOP_SERVER_FAILED = 'サーバーの停止に失敗しました';
export const ERROR_SEND_COMMAND_FAILED = 'コマンドの送信に失敗しました';
export const ERROR_GET_STATUS_FAILED = 'サーバーステータスの取得に失敗しました';
export const ERROR_GET_LOGS_FAILED = 'ログの取得に失敗しました';

// バックアップ操作
export const ERROR_LIST_BACKUPS_FAILED = 'バックアップ一覧の取得に失敗しました';
export const ERROR_CREATE_BACKUP_FAILED = 'バックアップの作成に失敗しました';
export const ERROR_DELETE_BACKUP_FAILED = 'バックアップの削除に失敗しました';

// Mod操作
export const ERROR_LIST_MODS_FAILED = 'Mod一覧の取得に失敗しました';
export const ERROR_UPLOAD_MOD_FAILED = 'Modのアップロードに失敗しました';
export const ERROR_DELETE_MOD_FAILED = 'Modの削除に失敗しました';
export const ERROR_TOGGLE_MOD_FAILED = 'Modの有効/無効切り替えに失敗しました';

// プラグイン操作
export const ERROR_LIST_PLUGINS_FAILED = 'プラグイン一覧の取得に失敗しました';
export const ERROR_UPLOAD_PLUGIN_FAILED = 'プラグインのアップロードに失敗しました';
export const ERROR_DELETE_PLUGIN_FAILED = 'プラグインの削除に失敗しました';
export const ERROR_TOGGLE_PLUGIN_FAILED = 'プラグインの有効/無効切り替えに失敗しました';
export const ERROR_INSTALL_PLUGIN_FAILED = 'プラグインのインストールに失敗しました';
export const ERROR_DOWNLOAD_MODRINTH_FAILED = 'Modrinthからのダウンロードに失敗しました';

// ホワイトリスト操作
export const ERROR_GET_WHITELIST_FAILED = 'ホワイトリストの取得に失敗しました';
export const ERROR_ADD_WHITELIST_FAILED = 'ホワイトリストへの追加に失敗しました';
export const ERROR_REMOVE_WHITELIST_FAILED = 'ホワイトリストからの削除に失敗しました';

// プロパティ操作
export const ERROR_GET_PROPERTIES_FAILED = 'プロパティの取得に失敗しました';
export const ERROR_UPDATE_PROPERTIES_FAILED = 'プロパティの更新に失敗しました';

// スケジュール操作
export const ERROR_GET_SCHEDULE_FAILED = 'スケジュールの取得に失敗しました';
export const ERROR_UPDATE_SCHEDULE_FAILED = 'スケジュールの更新に失敗しました';

// バージョン操作
export const ERROR_UPDATE_VERSION_FAILED = 'バージョンの更新に失敗しました';

// ワールド操作
export const ERROR_GET_WORLD_INFO_FAILED = 'ワールド情報の取得に失敗しました';
export const ERROR_WORLD_IMPORT_FAILED = 'ワールドのインポートに失敗しました';
export const ERROR_IMPORT_WORLD_FAILED = 'ワールドのインポートに失敗しました';

// Discord通知操作
export const ERROR_SEND_TEST_NOTIFICATION_FAILED = 'テスト通知の送信に失敗しました';

// ヘルス監視操作
export const ERROR_GET_HEALTH_STATUS_FAILED = 'ヘルス状態の取得に失敗しました';

// プラグイン更新チェック
export const ERROR_CHECK_PLUGIN_UPDATES_FAILED = 'プラグイン更新のチェックに失敗しました';

// ============================================
// 接続エラー
// ============================================

export const ERROR_RCON_CONNECTION_REFUSED =
  'サーバーに接続できません。サーバーが完全に起動するまでお待ちください。';
export const ERROR_RCON_CONNECTION_TIMEOUT =
  '接続がタイムアウトしました。サーバーの状態を確認してください。';

// ============================================
// 状態エラー
// ============================================

export const ERROR_SERVER_IS_RUNNING =
  'サーバーが起動中です。インポートするには先にサーバーを停止してください';

// ============================================
// バックアップ関連エラー
// ============================================

export const ERROR_WORLD_FOLDER_NOT_FOUND = 'ワールドフォルダが見つかりません';
export const ERROR_NO_DATA_TO_BACKUP = 'バックアップするデータがありません';
export const ERROR_WHITELIST_FILE_NOT_FOUND = 'ホワイトリストファイルが見つかりません';

// ============================================
// ポート関連エラー
// ============================================

export const ERROR_PORT_ALREADY_IN_USE = 'ポートは既に他のサーバーで使用されています';
export const ERROR_RCON_PORT_ALREADY_IN_USE = 'RCONポートは既に他のサーバーで使用されています';
export const ERROR_GEYSER_PORT_ALREADY_IN_USE =
  'GeyserMCポートは既に他のサーバーで使用されています';
export const ERROR_GAME_RCON_PORT_MUST_DIFFER = 'ゲームポートとRCONポートは異なる値にしてください';
export const ERROR_GEYSER_PORT_MUST_DIFFER =
  'GeyserMCポートはゲームポート・RCONポートと異なる値にしてください';

/**
 * ポート使用中エラーを生成
 */
export function createPortInUseError(portType: string, port: number): string {
  return `${portType}ポート ${port} は既に他のサーバーで使用されています`;
}

// ============================================
// RCON関連エラー
// ============================================

export const ERROR_COMMAND_IS_EMPTY = 'コマンドが空です';
export const ERROR_MESSAGE_EMPTY_OR_INVALID = 'メッセージが空か、無効な文字のみで構成されています';

/**
 * 許可されていないコマンドエラーを生成
 */
export function createCommandNotAllowedError(
  command: string,
  allowedCommands: readonly string[]
): string {
  return `コマンド "${command}" は許可されていません。許可されたコマンド: ${allowedCommands.join(', ')}`;
}

/**
 * RCONコマンド失敗エラーを生成
 */
export function createRconCommandFailedError(message: string): string {
  return `RCONコマンドが失敗しました: ${message}。サーバーの起動が完了していない可能性があります。`;
}

// ============================================
// 成功メッセージ
// ============================================

export const MSG_BACKUP_DELETED = 'バックアップを削除しました';

// ============================================
// ヘルパー関数
// ============================================

/**
 * エラーメッセージにコンテキストを追加
 */
export function withErrorContext(baseMessage: string, context: string): string {
  return `${baseMessage}: ${context}`;
}

/**
 * バリデーションエラーメッセージを生成
 */
export function createValidationError(errors: string): string {
  return `バリデーションエラー: ${errors}`;
}

/**
 * 最小値エラーメッセージを生成
 */
export function createMinValueError(field: string, minValue: number, unit?: string): string {
  const unitStr = unit ? ` ${unit}` : '';
  return `${field}は${minValue}${unitStr}以上にしてください`;
}

/**
 * アドオン（プラグイン/Mod）が見つからないエラーを生成
 */
export function createAddonNotFoundError(typeName: string): string {
  return `${typeName}ファイルが見つかりません`;
}

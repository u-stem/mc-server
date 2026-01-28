// 共通UI文言

// ローディング
export const MSG_LOADING = '読み込み中...';

// エラー
export const MSG_UNKNOWN_ERROR = 'Unknown error';

// ボタンラベル
export const LABEL_DELETE = '削除';
export const LABEL_ADD = '追加';
export const LABEL_SAVE = '保存';
export const LABEL_CANCEL = 'キャンセル';
export const LABEL_CONFIRM = '確認';
export const LABEL_RETRY = '再試行';
export const LABEL_RESET = 'リセット';
export const LABEL_INSTALL = 'インストール';

// ステータス
export const STATUS_RUNNING = '稼働中';
export const STATUS_STOPPED = '停止中';
export const STATUS_STARTING = '起動中';
export const STATUS_STOPPING = '停止処理中';

// 確認ダイアログ
export const MSG_DELETE_CONFIRM_SUFFIX = 'を削除しますか？この操作は取り消せません。';

// アップロード
export const MSG_DRAG_DROP_JAR = '.jar ファイルをここにドラッグ&ドロップしてアップロード';
export const MSG_NOT_JAR_FILE_SUFFIX = 'は .jar ファイルではありません';

// サーバー状態
export const MSG_SERVER_STOPPED = 'サーバーが停止中です';
export const MSG_SERVER_RUNNING_RESTART_REQUIRED =
  'サーバーが起動中です。変更を反映するにはサーバーを再起動してください。';

// 空状態
export const MSG_NO_PLAYERS = '登録されているプレイヤーはいません';
export const MSG_NO_BACKUPS =
  'バックアップはまだありません。ワールドを保護するためにバックアップを作成しましょう。';
export const MSG_NO_MODS =
  'Modはまだありません。上のボタンまたはドラッグ&ドロップでアップロードしてください。';
export const MSG_NO_PLUGINS =
  'プラグインはまだありません。上のボタンまたはドラッグ&ドロップでアップロードしてください。';

// エラーページ
export const MSG_ERROR_OCCURRED = 'エラーが発生しました';
export const MSG_ERROR_UNEXPECTED = '予期しないエラーが発生しました。再試行してください。';
export const MSG_PAGE_NOT_FOUND = 'ページが見つかりません';
export const MSG_PAGE_NOT_FOUND_DESC = 'お探しのページは存在しないか、移動した可能性があります。';
export const MSG_SERVER_NOT_FOUND = 'サーバーが見つかりません';
export const MSG_SERVER_NOT_FOUND_DESC =
  '指定されたサーバーは存在しないか、削除された可能性があります。';
export const LABEL_BACK_TO_DASHBOARD = 'ダッシュボードに戻る';

// エラーメッセージ生成用
export function createFailureMessage(action: string): string {
  return `${action}に失敗しました`;
}

export function createSuccessMessage(action: string): string {
  return `${action}しました`;
}

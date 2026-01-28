import { BYTES_PER_KB } from './constants';

// ファイルサイズをフォーマット
export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= BYTES_PER_KB && unitIndex < units.length - 1) {
    size /= BYTES_PER_KB;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 日時をフォーマット
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ファイル名が.jarかどうかを判定
export function isJarFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.jar');
}

// 表示用にファイル名から.disabledを除去
export function formatFilename(filename: string): string {
  return filename.replace('.disabled', '');
}

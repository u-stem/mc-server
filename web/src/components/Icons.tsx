/**
 * 共通アイコンコンポーネント
 * lucide-react のアイコンを再エクスポートし、カスタムアイコンも定義
 */

// lucide-react からの再エクスポート
export {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Frown,
  HardDrive,
  HelpCircle,
  Info,
  Loader2,
  Play,
  Plus,
  Power,
  RefreshCw,
  Save,
  Server,
  Settings,
  Square,
  Trash2,
  Upload,
  User,
  Users,
  XCircle,
} from 'lucide-react';

import type { LucideProps } from 'lucide-react';

// アイコンサイズの定義
export const ICON_SIZE = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

export type IconSize = keyof typeof ICON_SIZE;

// 共通のアイコンProps
export interface IconProps extends LucideProps {
  size?: IconSize;
}

// サイズクラスを取得するヘルパー
export function getIconSizeClass(size: IconSize = 'md'): string {
  return ICON_SIZE[size];
}

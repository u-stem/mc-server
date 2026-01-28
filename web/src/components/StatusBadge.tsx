interface StatusBadgeProps {
  running: boolean;
  className?: string;
}

export function StatusBadge({ running, className = '' }: StatusBadgeProps) {
  const statusText = running ? '稼働中' : '停止中';

  return (
    <output
      aria-live="polite"
      aria-label={`サーバーステータス: ${statusText}`}
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full text-xs font-medium
        ${
          running
            ? 'bg-green-900/50 text-green-400 border border-green-700'
            : 'bg-gray-700/50 text-gray-400 border border-gray-600'
        }
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          w-2 h-2 rounded-full
          ${running ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}
        `}
      />
      {statusText}
    </output>
  );
}

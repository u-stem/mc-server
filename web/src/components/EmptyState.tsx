'use client';

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return <p className={`text-center py-4 text-gray-400 ${className}`}>{message}</p>;
}

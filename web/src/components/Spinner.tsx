'use client';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'lg', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-green-500 ${sizeStyles[size]} ${className}`}
    />
  );
}

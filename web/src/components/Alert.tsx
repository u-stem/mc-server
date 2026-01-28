'use client';

import { AlertTriangle, Info, XCircle } from './Icons';

type AlertVariant = 'info' | 'warning' | 'error';

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-900/30 border-blue-700 text-blue-400',
  warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
  error: 'bg-red-900/30 border-red-700 text-red-400',
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="w-4 h-4 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 flex-shrink-0" />,
};

export function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <div
      className={`mb-4 p-3 border rounded-lg text-sm flex items-start gap-2 ${variantStyles[variant]} ${className}`}
    >
      {variantIcons[variant]}
      <div>{children}</div>
    </div>
  );
}

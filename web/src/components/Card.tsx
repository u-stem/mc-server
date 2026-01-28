import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', as: Component = 'section', ...props }: CardProps) {
  return (
    <Component
      className={`
        bg-gray-800 border border-gray-700 rounded-xl
        shadow-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', id }: CardHeaderProps) {
  return (
    <header id={id} className={`px-6 py-4 border-b border-gray-700 ${className}`}>
      {children}
    </header>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

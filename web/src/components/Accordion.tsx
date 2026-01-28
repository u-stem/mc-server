'use client';

import { type ReactNode, useState } from 'react';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({ title, defaultOpen = false, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-100">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 bg-gray-800/50 border-t border-gray-700">{children}</div>}
    </div>
  );
}

interface AccordionGroupProps {
  children: ReactNode;
  className?: string;
}

export function AccordionGroup({ children, className = '' }: AccordionGroupProps) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}

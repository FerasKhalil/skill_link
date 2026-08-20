'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, onSelect, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  
  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div className={cn(
          'absolute z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}>
          {items.map(item => {
            if (item.separator) {
              return <div key={item.id} className="my-1 border-t border-slate-100" />;
            }
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); setOpen(false); }}
                disabled={item.disabled}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

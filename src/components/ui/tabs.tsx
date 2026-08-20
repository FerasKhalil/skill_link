'use client';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab: controlledTab, onChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id || '');
  const activeTab = controlledTab || internalTab;
  
  const handleChange = (tabId: string) => {
    setInternalTab(tabId);
    onChange(tabId);
  };
  
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="flex gap-0 overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            )}
            onClick={() => handleChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';

export function Toast() {
  const { toast, hideToast } = useApp();
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(hideToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);
  
  if (!toast) return null;
  
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };
  
  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg', bgColors[toast.type])}>
        {icons[toast.type]}
        <p className="text-sm font-medium text-slate-900">{toast.message}</p>
        <button onClick={hideToast} className="ml-2 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

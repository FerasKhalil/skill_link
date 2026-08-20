'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Locale, User, Notification } from '@/types';
import { mockUsers, mockNotifications } from '@/data/mock';

interface AppState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [user, setUser] = useState<User | null>(mockUsers[0]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<AppState['toast']>(null);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return (
    <AppContext.Provider value={{
      locale, setLocale, user, setUser, notifications, markNotificationRead,
      sidebarOpen, setSidebarOpen, mobileMenuOpen, setMobileMenuOpen,
      searchQuery, setSearchQuery, toast, showToast, hideToast
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

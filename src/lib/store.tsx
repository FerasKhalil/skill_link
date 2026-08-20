'use client';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Locale } from '@/types';
import { authApi, notificationsApi } from '@/lib/api-client';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  locale: string;
  role: 'customer' | 'provider' | 'admin' | 'moderator';
  accountState: string;
}

interface ProviderProfile {
  id: string;
  verificationStatus: string;
  ratingAvg: string | null;
  ratingCount: number;
  bookingCount: number;
  profession: string | null;
  locationCity: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  titleAr: string | null;
  body: string | null;
  bodyAr: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  providerProfile: ProviderProfile | null;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; locale?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<AppState['toast']>(null);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    notificationsApi.markRead({ ids: [id] }).catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        notificationsApi.list({ limit: '20' }),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch {}
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setProviderProfile(res.data.providerProfile || null);
      setLocale(res.data.user.locale as Locale);
    } catch {
      setUser(null);
      setProviderProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.data.user);
    setProviderProfile(res.data.providerProfile || null);
    setLocale(res.data.user.locale as Locale);
    fetchNotifications();
  }, [fetchNotifications]);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; locale?: string }) => {
    const res = await authApi.register(data);
    setUser(res.data.user);
    setLocale((data.locale || 'en') as Locale);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    setProviderProfile(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchUser();
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      let cancelled = false;
      (async () => {
        if (!cancelled) await fetchNotifications();
      })();
      return () => { cancelled = true; };
    }
  }, [user, fetchNotifications]);

  return (
    <AppContext.Provider value={{
      locale, setLocale, user, setUser, providerProfile, notifications, unreadCount,
      markNotificationRead, fetchNotifications,
      sidebarOpen, setSidebarOpen, mobileMenuOpen, setMobileMenuOpen,
      searchQuery, setSearchQuery, toast, showToast, hideToast,
      loading, login, register, logout, fetchUser,
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

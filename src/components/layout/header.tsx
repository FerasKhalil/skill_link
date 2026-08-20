'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown, Globe, LogOut, User, Settings, LayoutDashboard, Briefcase, MessageCircle, Calendar, Bookmark, Menu, X, Home, FolderOpen, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Avatar } from '@/components/ui/avatar';

export function Header() {
  const { locale, setLocale, user, logout, mobileMenuOpen, setMobileMenuOpen, notifications, unreadCount, markNotificationRead, searchQuery, setSearchQuery, loading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const closeAll = () => { setProfileOpen(false); setNotifOpen(false); setMobileMenuOpen(false); };

  const isProvider = user?.role === 'provider';
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const displayName = user ? `${user.firstName} ${user.lastName}` : '';

  const publicLinks = [
    { href: `/${locale}`, label: t(locale, 'nav.home'), icon: Home },
    { href: `/${locale}/categories`, label: t(locale, 'nav.categories'), icon: FolderOpen },
    { href: `/${locale}/search`, label: t(locale, 'common.search'), icon: Search },
  ];

  const customerLinks = [
    { href: `/${locale}/dashboard`, label: t(locale, 'nav.profile'), icon: LayoutDashboard },
    { href: `/${locale}/bookings`, label: t(locale, 'nav.bookings'), icon: Calendar },
    { href: `/${locale}/messages`, label: t(locale, 'nav.messages'), icon: MessageCircle },
    { href: `/${locale}/saved`, label: t(locale, 'nav.saved'), icon: Bookmark },
  ];

  const providerLinks = [
    { href: `/${locale}/dashboard`, label: t(locale, 'nav.profile'), icon: LayoutDashboard },
    { href: `/${locale}/provider/services`, label: t(locale, 'providerWorkspace.services'), icon: Briefcase },
    { href: `/${locale}/provider/bookings`, label: t(locale, 'providerWorkspace.bookings'), icon: Calendar },
    { href: `/${locale}/provider/messages`, label: t(locale, 'nav.messages'), icon: MessageCircle },
  ];

  const adminLinks = [
    { href: `/${locale}/dashboard`, label: t(locale, 'nav.profile'), icon: LayoutDashboard },
    { href: `/${locale}/admin`, label: t(locale, 'nav.admin'), icon: Shield },
  ];

  const navLinks = !user ? publicLinks : isAdmin ? adminLinks : isProvider ? providerLinks : customerLinks;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href={user ? `/${locale}/dashboard` : `/${locale}`} className="flex items-center gap-2 shrink-0" onClick={closeAll}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">S</div>
              <span className="text-xl font-bold text-slate-900 hidden sm:block">SkillLink</span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t(locale, 'common.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === link.href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {!loading && user ? (
                <>
                  <div className="relative">
                    <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                      className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-50 transition-colors">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{t(locale, 'nav.notifications')}</h3>
                          <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">{t(locale, 'common.noResults')}</div>
                          ) : notifications.map(n => (
                            <button key={n.id}
                              onClick={() => { if (!n.isRead) markNotificationRead(n.id); if (n.link) router.push(n.link); setNotifOpen(false); }}
                              className={cn('block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50', !n.isRead && 'bg-emerald-50/50')}>
                              <p className="text-sm font-medium text-slate-900">{locale === 'ar' && n.titleAr ? n.titleAr : n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{locale === 'ar' && n.bodyAr ? n.bodyAr : n.body}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                      <Avatar src={user?.avatarUrl || undefined} name={displayName} size="sm" alt={displayName} />
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{displayName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href={`/${locale}/dashboard`} onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                            <User className="h-4 w-4" />{t(locale, 'nav.profile')}
                          </Link>
                          {isProvider && (
                            <Link href={`/${locale}/provider/workspace`} onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                              <Briefcase className="h-4 w-4" />{t(locale, 'nav.providerWorkspace')}
                            </Link>
                          )}
                          {isAdmin && (
                            <Link href={`/${locale}/admin`} onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                              <LayoutDashboard className="h-4 w-4" />{t(locale, 'nav.admin')}
                            </Link>
                          )}
                          <Link href={`/${locale}/settings`} onClick={closeAll} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                            <Settings className="h-4 w-4" />{t(locale, 'nav.settings')}
                          </Link>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => { logout(); closeAll(); window.location.href = `/${locale}`; }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />{t(locale, 'nav.signOut')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : !loading ? (
                <div className="flex items-center gap-2">
                  <Link href={`/${locale}/sign-in`}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    {t(locale, 'nav.signIn')}
                  </Link>
                  <Link href={`/${locale}/sign-up`}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                    {t(locale, 'nav.signUp')}
                  </Link>
                </div>
              ) : null}

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-50 transition-colors">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={closeAll} />
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 space-y-1">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={t(locale, 'common.searchPlaceholder')} value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none" />
              </div>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={closeAll}
                  className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === link.href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50')}>
                  <link.icon className="h-4 w-4" />{link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <div className="my-3 border-t border-slate-100" />
                  <Link href={`/${locale}/sign-in`} onClick={closeAll} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <Shield className="h-4 w-4" />{t(locale, 'nav.signIn')}
                  </Link>
                  <Link href={`/${locale}/sign-up`} onClick={closeAll} className="flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
                    {t(locale, 'nav.signUp')}
                  </Link>
                </>
              )}
              {user && (
                <>
                  <div className="my-3 border-t border-slate-100" />
                  <Link href={`/${locale}/settings`} onClick={closeAll} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <Settings className="h-4 w-4" />{t(locale, 'nav.settings')}
                  </Link>
                  <button onClick={() => { logout(); closeAll(); window.location.href = `/${locale}`; }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />{t(locale, 'nav.signOut')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

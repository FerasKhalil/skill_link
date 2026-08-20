'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { t } from '@/i18n';
import { adminApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, FileText, Flag, BarChart3, Clock, AlertTriangle, TrendingUp, Search, BookOpen, ChevronLeft, ChevronRight as ChevronRightIcon, Loader2, LogOut, MessageCircle, Calendar } from 'lucide-react';
import { conversationsApi } from '@/lib/api-client';

interface OverviewData {
  users: { total: number; newLast7Days: number; suspended: number; byRole: Record<string, number> };
  providers: { total: number; approved: number; pendingVerifications: number };
  listings: { total: number; active: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  reports: { total: number; open: number; underReview: number };
  reviews: { total: number; avgRating: number };
  conversations: { total: number };
  messages: { total: number };
  recentUsers: any[];
  recentBookings: any[];
  recentReviews: any[];
}

const ROLES = ['customer', 'provider', 'admin', 'moderator'] as const;

export default function AdminPage() {
  const { user, locale, showToast, logout } = useApp();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1 });
  const [providers, setProviders] = useState<any[]>([]);
  const [providersPagination, setProvidersPagination] = useState({ page: 1, totalPages: 1 });
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsPagination, setApplicationsPagination] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, totalPages: 1 });
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, totalPages: 1 });
  const [adminConversations, setAdminConversations] = useState<any[]>([]);
  const [adminConversationsLoading, setAdminConversationsLoading] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAllowed = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    if (!loading && user !== null && !isAllowed) {
      showToast('Access Denied: You do not have permission to view this page.', 'error');
      const timer = setTimeout(() => router.push(`/${locale}`), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, isAllowed, locale, router, showToast]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await adminApi.overview();
      setOverview(res.data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load overview', 'error');
    }
  }, [showToast]);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (userSearch) params.q = userSearch;
      const res = await adminApi.getUsers(params);
      setUsers(res.data);
      setUsersCount(res.pagination?.total || res.data.length);
      setUsersPagination({ page: res.pagination.page, totalPages: res.pagination.totalPages });
    } catch (e: any) {
      showToast(e.message || 'Failed to load users', 'error');
    }
  }, [userSearch, showToast]);

  const fetchProviders = useCallback(async (page = 1) => {
    try {
      const res = await adminApi.getProviders({ page: String(page), limit: '20' });
      setProviders(res.data);
      setProvidersPagination({ page: res.pagination.page, totalPages: res.pagination.totalPages });
    } catch (e: any) {
      showToast(e.message || 'Failed to load providers', 'error');
    }
  }, [showToast]);

  const fetchApplications = useCallback(async (page = 1) => {
    try {
      const res = await adminApi.getApplications({ page: String(page), limit: '20' });
      setApplications(res.data);
      setApplicationsPagination({ page: res.pagination.page, totalPages: res.pagination.totalPages });
    } catch (e: any) {
      showToast(e.message || 'Failed to load applications', 'error');
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load categories', 'error');
    }
  }, [showToast]);

  const fetchReports = useCallback(async (page = 1) => {
    try {
      const res = await adminApi.getReports({ page: String(page), limit: '20' });
      setReports(res.data);
      setReportsPagination({ page: res.pagination.page, totalPages: res.pagination.totalPages });
    } catch (e: any) {
      showToast(e.message || 'Failed to load reports', 'error');
    }
  }, [showToast]);

  const fetchAudit = useCallback(async (page = 1) => {
    try {
      const res = await adminApi.getAuditLog({ page: String(page), limit: '20' });
      setAuditLog(res.data);
      setAuditPagination({ page: res.pagination.page, totalPages: res.pagination.totalPages });
    } catch (e: any) {
      showToast(e.message || 'Failed to load audit log', 'error');
    }
  }, [showToast]);

  const fetchAdminConversations = useCallback(async () => {
    setAdminConversationsLoading(true);
    try {
      const r = await conversationsApi.list();
      setAdminConversations(r.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load conversations', 'error');
    } finally {
      setAdminConversationsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAllowed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        fetchOverview(),
        fetchUsers(),
        fetchProviders(),
        fetchApplications(),
        fetchCategories(),
        fetchReports(),
        fetchAudit(),
      ]);
      if (!cancelled) {
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0 && results.every(r => r.status === 'rejected')) {
          setError('Failed to load admin data. Make sure you are logged in as an admin.');
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAllowed, fetchOverview, fetchUsers, fetchProviders, fetchApplications, fetchCategories, fetchReports, fetchAudit]);

  useEffect(() => {
    (async () => {
      if (activeSection === 'users') await fetchUsers(1);
      if (activeSection === 'providers') await fetchProviders(1);
      if (activeSection === 'applications') await fetchApplications(1);
      if (activeSection === 'categories') await fetchCategories();
      if (activeSection === 'messages') await fetchAdminConversations();
      if (activeSection === 'reports') await fetchReports(1);
      if (activeSection === 'audit') await fetchAudit(1);
    })();
  }, [activeSection, fetchUsers, fetchProviders, fetchApplications, fetchCategories, fetchAdminConversations, fetchReports, fetchAudit]);

  const handleUserSearch = () => { fetchUsers(1); };

  const handleUpdateUser = async (userId: string, updates: { role?: string; accountState?: string }) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUser({ userId, ...updates });
      showToast('User updated', 'success');
      fetchUsers(usersPagination.page);
      fetchOverview();
    } catch (e: any) {
      showToast(e.message || 'Failed to update user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProvider = async (providerProfileId: string, verificationStatus: string) => {
    setActionLoading(providerProfileId);
    try {
      await adminApi.updateProvider({ providerProfileId, verificationStatus });
      showToast('Provider updated', 'success');
      fetchProviders(providersPagination.page);
      fetchOverview();
    } catch (e: any) {
      showToast(e.message || 'Failed to update provider', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewApplication = async (applicationId: string, status: string) => {
    setActionLoading(applicationId);
    try {
      await adminApi.reviewApplication({ applicationId, status });
      showToast('Application reviewed', 'success');
      fetchApplications(applicationsPagination.page);
      fetchOverview();
    } catch (e: any) {
      showToast(e.message || 'Failed to review application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    setActionLoading(reportId);
    try {
      await adminApi.resolveReport({ reportId, status });
      showToast('Report updated', 'success');
      fetchReports(reportsPagination.page);
      fetchOverview();
    } catch (e: any) {
      showToast(e.message || 'Failed to update report', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessageToUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const conv = await conversationsApi.create({ participantId: userId } as any);
      router.push(`/${locale}/messages/${conv.data.id}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to start conversation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const sections = [
    { id: 'overview', label: t(locale, 'admin.overview'), icon: BarChart3 },
    { id: 'users', label: t(locale, 'admin.users'), icon: Users },
    { id: 'providers', label: t(locale, 'admin.providers'), icon: Shield },
    { id: 'applications', label: t(locale, 'admin.verificationList.title'), icon: FileText },
    { id: 'categories', label: t(locale, 'admin.categories'), icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'reports', label: t(locale, 'admin.reports'), icon: Flag },
    { id: 'audit', label: t(locale, 'admin.auditLog'), icon: Clock },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (!isAllowed || error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-4">{error || 'You do not have permission to view this page.'}</p>
          <Button onClick={() => router.push(`/${locale}`)}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'admin.title')}</h1>
          <p className="text-slate-500">Manage users, providers, content, and reports</p>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <nav className="space-y-1">
            {sections.map(section => (
              <button key={section.id} onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {activeSection === 'overview' && !overview && (
            <div className="text-center py-12 text-slate-500">No overview data available</div>
          )}
          {activeSection === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t(locale, 'admin.stats.totalUsers'), value: overview.users.total, sub: `+${overview.users.newLast7Days} this week`, icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { label: t(locale, 'admin.stats.totalProviders'), value: overview.providers.total, sub: `${overview.providers.approved} verified`, icon: Shield, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Avg Rating', value: overview.reviews.avgRating > 0 ? overview.reviews.avgRating.toFixed(1) : 'N/A', sub: `${overview.reviews.total} reviews`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
                  { label: t(locale, 'admin.stats.totalListings'), value: overview.listings.total, sub: `${overview.listings.active} active`, icon: FileText, color: 'bg-purple-50 text-purple-600' },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        {stat.sub && <p className="text-xs text-slate-400">{stat.sub}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pending Verifications', value: overview.providers.pendingVerifications, icon: Clock, color: 'bg-orange-50 text-orange-600', urgent: overview.providers.pendingVerifications > 0 },
                  { label: 'Open Reports', value: overview.reports.open, icon: AlertTriangle, color: 'bg-red-50 text-red-600', urgent: overview.reports.open > 0 },
                  { label: 'Suspended Users', value: overview.users.suspended, icon: Shield, color: 'bg-slate-100 text-slate-600', urgent: false },
                  { label: 'Bookings This Week', value: overview.bookings.total, sub: `${overview.bookings.completed} completed`, icon: TrendingUp, color: 'bg-teal-50 text-teal-600', urgent: false },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        {stat.sub && <p className="text-xs text-slate-400">{stat.sub}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Users by Role</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(overview.users.byRole || {}).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={role === 'admin' ? 'danger' : role === 'provider' ? 'success' : 'default'} size="sm">{role}</Badge>
                          </div>
                          <span className="font-medium text-sm">{count as number}</span>
                        </div>
                      ))}
                      {Object.keys(overview.users.byRole || {}).length === 0 && (
                        <p className="text-sm text-slate-500">No users</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Bookings</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Pending</span><span className="font-medium text-amber-600">{overview.bookings.pending}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Confirmed</span><span className="font-medium text-blue-600">{overview.bookings.confirmed}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Completed</span><span className="font-medium text-emerald-600">{overview.bookings.completed}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Cancelled</span><span className="font-medium text-red-600">{overview.bookings.cancelled}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Conversations</span><span className="font-medium">{overview.conversations.total}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Messages</span><span className="font-medium">{overview.messages.total}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Reports (Total)</span><span className="font-medium">{overview.reports.total}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Under Review</span><span className="font-medium text-amber-600">{overview.reports.underReview}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Recent Users</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(overview.recentUsers || []).length === 0 ? (
                        <p className="text-sm text-slate-500">No users yet</p>
                      ) : (overview.recentUsers || []).map((u: any) => (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {(u.displayName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{u.displayName || u.email}</p>
                            <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'provider' ? 'success' : 'default'} size="sm">{u.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Recent Bookings</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(overview.recentBookings || []).length === 0 ? (
                        <p className="text-sm text-slate-500">No bookings yet</p>
                      ) : (overview.recentBookings || []).map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs shrink-0">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-700">{new Date(b.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={b.state === 'completed' ? 'success' : b.state === 'pending' ? 'warning' : b.state === 'cancelled' ? 'danger' : 'default'} size="sm">{b.state}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Users</h2>
                <Badge variant="outline" size="sm">{usersCount} total</Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input placeholder={t(locale, 'admin.usersList.search')} value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUserSearch()}
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <Button size="sm" onClick={handleUserSearch}>Search</Button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Created</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{u.displayName || `${u.firstName} ${u.lastName}`}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {actionLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <select
                              value={u.role}
                              onChange={e => handleUpdateUser(u.id, { role: e.target.value })}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                            >
                              {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.accountState === 'active' ? 'success' : u.accountState === 'suspended' ? 'danger' : 'default'} size="sm">{u.accountState}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {actionLoading === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleSendMessageToUser(u.id)} title="Send message">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                {u.accountState === 'active' ? (
                                  <Button variant="ghost" size="sm" onClick={() => handleUpdateUser(u.id, { accountState: 'suspended' })}>Suspend</Button>
                                ) : (
                                  <Button variant="ghost" size="sm" onClick={() => handleUpdateUser(u.id, { accountState: 'active' })}>Activate</Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {usersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm" disabled={usersPagination.page <= 1} onClick={() => fetchUsers(usersPagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {usersPagination.page} of {usersPagination.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={usersPagination.page >= usersPagination.totalPages} onClick={() => fetchUsers(usersPagination.page + 1)}>
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'providers' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(locale, 'admin.verificationList.title')}</h2>
              <div className="space-y-3">
                {providers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No providers found</div>
                ) : providers.map(provider => (
                  <Card key={provider.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {(provider.userDisplayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{provider.userDisplayName}</p>
                        <p className="text-sm text-slate-500">{provider.profession || provider.title}</p>
                      </div>
                      <Badge variant={provider.verificationStatus === 'approved' ? 'success' : provider.verificationStatus === 'pending' ? 'warning' : 'default'} size="sm">
                        {provider.verificationStatus}
                      </Badge>
                      <div className="flex gap-2">
                        {actionLoading === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {provider.verificationStatus !== 'approved' && (
                              <Button size="sm" onClick={() => handleUpdateProvider(provider.id, 'approved')}>Approve</Button>
                            )}
                            {provider.verificationStatus === 'approved' && (
                              <Button variant="ghost" size="sm" onClick={() => handleUpdateProvider(provider.id, 'rejected')}>Reject</Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {providersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm" disabled={providersPagination.page <= 1} onClick={() => fetchProviders(providersPagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {providersPagination.page} of {providersPagination.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={providersPagination.page >= providersPagination.totalPages} onClick={() => fetchProviders(providersPagination.page + 1)}>
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'applications' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Provider Applications</h2>
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No applications found</div>
                ) : applications.map(app => (
                  <Card key={app.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900">{app.userDisplayName || app.userEmail}</p>
                            <Badge variant={app.status === 'approved' ? 'success' : app.status === 'pending' ? 'warning' : app.status === 'rejected' ? 'danger' : 'default'} size="sm">
                              {app.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">{app.profession} {app.title ? `- ${app.title}` : ''}</p>
                          {app.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{app.bio}</p>}
                          <p className="text-xs text-slate-400 mt-1">Submitted {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {actionLoading === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : app.status === 'pending' ? (
                            <>
                              <Button size="sm" onClick={() => handleReviewApplication(app.id, 'approved')}>Approve</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReviewApplication(app.id, 'rejected')}>Reject</Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {applicationsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm" disabled={applicationsPagination.page <= 1} onClick={() => fetchApplications(applicationsPagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {applicationsPagination.page} of {applicationsPagination.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={applicationsPagination.page >= applicationsPagination.totalPages} onClick={() => fetchApplications(applicationsPagination.page + 1)}>
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'categories' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(locale, 'admin.categories')}</h2>
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No categories found</div>
                ) : categories.map(cat => (
                  <Card key={cat.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{cat.nameEn} / {cat.nameAr}</p>
                        <p className="text-sm text-slate-500">{cat.listingCount || 0} listings</p>
                      </div>
                      <Badge variant={cat.status === 'active' ? 'success' : cat.status === 'suggested' ? 'warning' : 'default'} size="sm">{cat.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(locale, 'admin.reportList.title')}</h2>
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No reports found</div>
                ) : reports.map(report => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Flag className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="danger" size="sm">{report.reason}</Badge>
                            <Badge variant={report.status === 'open' ? 'warning' : report.status === 'resolved' ? 'success' : 'default'} size="sm">{report.status}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{report.description || report.targetType}</p>
                          <p className="text-xs text-slate-400 mt-1">Reported by {report.reporterDisplayName || 'Unknown'} on {new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {actionLoading === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : report.status !== 'resolved' && report.status !== 'dismissed' ? (
                            <>
                              <Button size="sm" onClick={() => handleResolveReport(report.id, 'resolved')}>Resolve</Button>
                              <Button variant="ghost" size="sm" onClick={() => handleResolveReport(report.id, 'dismissed')}>Dismiss</Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {reportsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm" disabled={reportsPagination.page <= 1} onClick={() => fetchReports(reportsPagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {reportsPagination.page} of {reportsPagination.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={reportsPagination.page >= reportsPagination.totalPages} onClick={() => fetchReports(reportsPagination.page + 1)}>
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'messages' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Messages</h2>
              {adminConversationsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
              ) : adminConversations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No conversations yet. Use the Users section to message someone.</div>
              ) : (
                <div className="space-y-2">
                  {adminConversations.map((conv: any) => (
                    <Link key={conv.id} href={`/${locale}/messages/${conv.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {conv.otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">{conv.otherUser?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview || 'No messages yet'}</p>
                      </div>
                      {conv.unreadCount > 0 && <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-xs">{conv.unreadCount}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(locale, 'admin.auditLog')}</h2>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actor</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLog.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No audit events</td></tr>
                    ) : auditLog.map(event => (
                      <tr key={event.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{event.actorDisplayName || event.actorEmail || 'System'}</td>
                        <td className="px-4 py-3"><Badge variant="outline" size="sm">{event.action}</Badge></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{event.targetType} {event.targetId ? `(${event.targetId.slice(0, 8)}...)` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {auditPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm" disabled={auditPagination.page <= 1} onClick={() => fetchAudit(auditPagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {auditPagination.page} of {auditPagination.totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={auditPagination.page >= auditPagination.totalPages} onClick={() => fetchAudit(auditPagination.page + 1)}>
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

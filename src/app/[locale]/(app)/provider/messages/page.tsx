'use client';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { conversationsApi } from '@/lib/api-client';

export default function ProviderMessagesPage() {
  const { locale } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conversationsApi.list()
      .then(r => setConversations(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerWorkspace.messages')}</h1>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No messages yet.</p>
          <Link href={`/${locale}/provider/workspace`}>
            <Button size="sm">Go to Workspace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => (
            <Link key={conv.id} href={`/${locale}/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {conv.otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{conv.otherUser?.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview || 'No messages'}</p>
              </div>
              {conv.unreadCount > 0 && <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-xs">{conv.unreadCount}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { conversationsApi } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessagesPage() {
  const { locale } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await conversationsApi.list();
        if (!cancelled) setConversations(r.data || []);
      } catch {
        // ignored
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'chat.title')}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t(locale, 'chat.noConversations')}</h3>
          <p className="text-slate-500 mb-4">{t(locale, 'chat.startConversation')}</p>
          <Link href={`/${locale}/search`}>
            <Button size="sm">Find a provider</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => (
            <Link key={conv.id} href={`/${locale}/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold shrink-0">
                {conv.otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{conv.otherUser?.displayName || 'User'}</p>
                  {conv.lastMessageAt && (
                    <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(conv.lastMessageAt, locale)}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{conv.lastMessagePreview || 'No messages yet'}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="bg-emerald-600 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-bold">{conv.unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

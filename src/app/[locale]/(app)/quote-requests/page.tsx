'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { quotesApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QuoteRequestsPage() {
  const { locale, showToast } = useApp();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await quotesApi.list();
        if (!cancelled) setQuotes(r.data || []);
      } catch (e: any) {
        if (!cancelled) showToast(e.message || 'Failed to load quotes', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToast]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'quotes.title')}</h1>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">{t(locale, 'quotes.noQuotes')}</p>
          <Link href={`/${locale}/search`}>
            <Button size="sm">Find a provider</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((qr: any) => (
            <Card key={qr.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{qr.title || 'Quote Request'}</p>
                    <p className="text-sm text-slate-500 mt-1">{qr.description}</p>
                    {qr.budget && <p className="text-xs text-emerald-600 mt-1">Budget: {qr.budget} {qr.currency || 'JOD'}</p>}
                    <p className="text-xs text-slate-400 mt-2">{formatDate(qr.createdAt, locale)}</p>
                    {qr.providerResponse && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-50">
                        <p className="text-xs font-medium text-slate-500">Provider response:</p>
                        <p className="text-sm text-slate-700">{qr.providerResponse}</p>
                        {qr.providerPrice && <p className="text-sm text-emerald-600 font-medium mt-1">Price: {qr.providerPrice} JOD</p>}
                      </div>
                    )}
                  </div>
                  <Badge variant={qr.status === 'pending' ? 'warning' : qr.status === 'accepted' ? 'success' : qr.status === 'declined' ? 'danger' : 'default'}>
                    {qr.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { conversationsApi } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { locale, user, showToast } = useApp();
  const [convId, setConvId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(p => {
      setConvId(p.id);
      setLoading(true);
      conversationsApi.getMessages(p.id)
        .then(msgs => {
          setMessages((msgs.data || []).reverse());
          if (msgs.data?.length) {
            const msg = msgs.data.find((m: any) => m.senderId !== user?.id);
            if (msg?.sender) setOtherUser(msg.sender);
            else if (msg?.senderDisplayName) setOtherUser({ displayName: msg.senderDisplayName, id: msg.senderId });
          }
        })
        .catch(() => showToast('Failed to load messages', 'error'))
        .finally(() => setLoading(false));
    });
  }, [params, showToast, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await conversationsApi.sendMessage(convId, newMessage.trim());
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (e: any) {
      showToast(e.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <Link href={`/${locale}/messages`} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className={`h-5 w-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          </Link>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
            {otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 text-sm">{otherUser?.displayName || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 130px)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No messages yet. Start the conversation!</div>
          ) : messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                msg.senderId === user?.id
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-900 rounded-bl-md'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {formatRelativeTime(msg.createdAt, locale)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-slate-200 bg-white">
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
            placeholder={t(locale, 'chat.typeMessage')}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button type="submit" disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

import { type ClassValue, clsx } from 'clsx';
import type { Locale } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatDate(date: string, locale: Locale = 'en'): string {
  return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function formatTime(date: string, locale: Locale = 'en'): string {
  return new Date(date).toLocaleTimeString(locale === 'ar' ? 'ar-JO' : 'en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatRelativeTime(date: string, locale: Locale = 'en'): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ar') {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(date, 'ar');
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, 'en');
}

export function formatCurrency(amount: number, currency: string = 'JOD'): string {
  return `${amount} ${currency}`;
}

export function generateSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

export function getDeliveryModeLabel(mode: string, locale: Locale = 'en'): string {
  const labels: Record<string, Record<Locale, string>> = {
    online: { en: 'Online', ar: 'أونلاين' },
    provider_location: { en: 'At Provider', ar: 'عند مزود الخدمة' },
    customer_location: { en: 'At Your Location', ar: 'عندك' },
  };
  return labels[mode]?.[locale] || mode;
}

export function getPricingModelLabel(model: string, locale: Locale = 'en'): string {
  const labels: Record<string, Record<Locale, string>> = {
    fixed: { en: 'Fixed Price', ar: 'سعر ثابت' },
    starting_from: { en: 'Starting From', ar: 'يبدأ من' },
    hourly: { en: 'Per Hour', ar: 'بالساعة' },
    quote_only: { en: 'Quote on Request', ar: 'سعر عند الطلب' },
  };
  return labels[model]?.[locale] || model;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    suspended: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    paused: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

import en from './en';
import ar from './ar';
import type { Locale } from '@/types';

const dictionaries = { en, ar } as const;

export type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.en;
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = dictionaries[locale] || dictionaries.en;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
      value
    );
  }

  return value;
}

export function getLocalizedText(obj: { ar: string; en: string } | undefined, locale: Locale): string {
  if (!obj) return '';
  return obj[locale] || obj.en || obj.ar || '';
}

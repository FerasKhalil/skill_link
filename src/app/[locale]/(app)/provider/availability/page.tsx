'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

export default function AvailabilityPage() {
  const { locale, showToast } = useApp();
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    Tuesday: ['09:00', '10:00', '11:00'],
    Wednesday: ['14:00', '15:00', '16:00'],
    Thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    Friday: [],
    Saturday: ['10:00', '11:00'],
    Sunday: [],
  });

  const toggleSlot = (day: string, time: string) => {
    setSchedule(prev => {
      const slots = prev[day] || [];
      return { ...prev, [day]: slots.includes(time) ? slots.filter(s => s !== time) : [...slots, time] };
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'providerWorkspace.availability')}</h1>
        <Button onClick={() => showToast('Availability saved!', 'success')}>{t(locale, 'common.save')}</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Day</th>
                {hours.map(h => <th key={h} className="px-2 py-3 font-medium text-slate-500 text-center text-xs">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{day}</td>
                  {hours.map(time => {
                    const available = schedule[day]?.includes(time);
                    return (
                      <td key={time} className="px-1 py-2 text-center">
                        <button onClick={() => toggleSlot(day, time)}
                          className={`w-full h-8 rounded transition-colors ${available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-100 hover:bg-slate-200'}`} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

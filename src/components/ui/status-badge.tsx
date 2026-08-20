import { cn, getStatusColor } from '@/lib/utils';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const statusLabels: Record<string, Record<string, string>> = {
  active: { en: 'Active', ar: 'نشط' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  approved: { en: 'Approved', ar: 'تمت الموافقة' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
  suspended: { en: 'Suspended', ar: 'معلق' },
  new: { en: 'New', ar: 'جديد' },
  investigating: { en: 'Investigating', ar: 'قيد التحقيق' },
  resolved: { en: 'Resolved', ar: 'تم الحل' },
  draft: { en: 'Draft', ar: 'مسودة' },
  paused: { en: 'Paused', ar: 'متوقف' },
  pending_provider: { en: 'Awaiting Approval', ar: 'بانتظار الموافقة' },
  declined: { en: 'Declined', ar: 'مرفوض' },
  no_show: { en: 'No Show', ar: 'لم يحضر' },
  expired: { en: 'Expired', ar: 'منتهي' },
  block: { en: 'Blocked', ar: 'محظور' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const badgeColor = getStatusColor(status);
  const displayLabel = label || statusLabels[status]?.en || status;
  
  return (
    <Badge className={cn(badgeColor, className)}>
      {displayLabel}
    </Badge>
  );
}

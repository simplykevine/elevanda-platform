import Card from '../ui/Card';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconColor = 'text-slate-600',
}: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn('mt-0.5 rounded-lg bg-slate-100 p-2.5', iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100'))}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 truncate">{value}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </Card>
  );
}
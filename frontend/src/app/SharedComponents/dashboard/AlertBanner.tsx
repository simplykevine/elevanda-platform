import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface AlertBannerProps {
  message: string;
  type?: 'warning' | 'info';
}

export default function AlertBanner({ message, type = 'warning' }: AlertBannerProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
        type === 'warning'
          ? 'bg-amber-50 border border-amber-200 text-amber-800'
          : 'bg-blue-50 border border-blue-200 text-blue-800'
      }`}
    >
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <p className="flex-1">{message}</p>
      <button onClick={() => setVisible(false)} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
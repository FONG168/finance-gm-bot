'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { ROLE_COLORS } from '@/lib/utils';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { admin } = useAuth();
  const roleColor = (ROLE_COLORS[admin?.role || ''] || 'bg-gray-500/20 text-gray-400').split(' ');

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[admin?.role || ''] || ''}`}>
          {admin?.role?.replace('_', ' ')}
        </div>
      </div>
    </header>
  );
}

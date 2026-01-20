import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface FlowCardProps {
  children: ReactNode;
  icon?: LucideIcon;
  title: string;
  description?: string;
  status?: 'active' | 'pending' | 'completed';
  className?: string;
}

export default function FlowCard({
  children,
  icon: Icon,
  title,
  description,
  status = 'pending',
  className = ''
}: FlowCardProps) {
  const statusColors = {
    active: 'border-blue-500/50 bg-blue-500/10',
    pending: 'border-gray-700/50 bg-gray-900/40',
    completed: 'border-green-500/50 bg-green-500/10'
  };

  const iconColors = {
    active: 'text-blue-400',
    pending: 'text-gray-500',
    completed: 'text-green-400'
  };

  return (
    <div className={`rounded-2xl p-5 border-2 transition-all ${statusColors[status]} ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className={`flex-shrink-0 ${iconColors[status]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white mb-1">{title}</h4>
          {description && (
            <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}


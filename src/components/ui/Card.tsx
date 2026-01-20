import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'gradient' | 'outlined';
}

export default function Card({
  children,
  icon: Icon,
  title,
  subtitle,
  className = '',
  variant = 'default'
}: CardProps) {
  const variantClasses = {
    default: 'backdrop-blur-xl bg-gray-900/40 border border-gray-800/50',
    gradient: 'bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-700/50',
    outlined: 'bg-transparent border-2 border-gray-700/50'
  };

  return (
    <div className={`rounded-3xl p-6 shadow-2xl ${variantClasses[variant]} ${className}`}>
      {(Icon || title || subtitle) && (
        <div className="flex items-center gap-3 mb-4">
          {Icon && <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-bold text-white truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}


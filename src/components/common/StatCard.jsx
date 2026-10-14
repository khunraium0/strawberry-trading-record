import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'purchase' | 'sales' | 'customer' | 'default' | 'neutral'
  className = '',
}) {
  const variantStyles = {
    purchase: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-600 text-white',
      valueColor: 'text-emerald-950',
    },
    sales: {
      bg: 'bg-rose-50/70',
      border: 'border-rose-100',
      text: 'text-rose-700',
      iconBg: 'bg-rose-600 text-white',
      valueColor: 'text-rose-950',
    },
    customer: {
      bg: 'bg-blue-50/70',
      border: 'border-blue-100',
      text: 'text-blue-700',
      iconBg: 'bg-blue-600 text-white',
      valueColor: 'text-blue-950',
    },
    neutral: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      iconBg: 'bg-slate-700 text-white',
      valueColor: 'text-slate-900',
    },
    default: {
      bg: 'bg-white',
      border: 'border-slate-100',
      text: 'text-slate-500',
      iconBg: 'bg-rose-500 text-white',
      valueColor: 'text-slate-900',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border shadow-sm transition-all hover:shadow-md bg-white ${style.border} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate mb-1">{title}</p>
          <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${style.valueColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${style.iconBg}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

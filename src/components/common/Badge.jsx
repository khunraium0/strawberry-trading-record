import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variantStyles = {
    supplier: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    buyer: 'bg-rose-50 text-rose-700 border-rose-200',
    both: 'bg-purple-50 text-purple-700 border-purple-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    strawberry: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

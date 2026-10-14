import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { toInputDateFormat } from '../../utils/formatters';

export function DateFilter({
  selectedFilter, // 'today' | 'this_month' | 'custom' | 'all'
  onSelectFilter,
  customStart,
  customEnd,
  onChangeCustomStart,
  onChangeCustomEnd,
}) {
  const options = [
    { id: 'today', label: 'Today' },
    { id: 'this_month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Quick Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 pl-1 pr-1 hidden sm:inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> Date:
        </span>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectFilter(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFilter === opt.id
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Inputs */}
      {selectedFilter === 'custom' && (
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onChangeCustomStart(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          <span className="text-xs text-slate-400 font-medium">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onChangeCustomEnd(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      )}
    </div>
  );
}

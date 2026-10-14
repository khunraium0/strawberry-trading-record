import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  FileBarChart2,
  ChevronRight,
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'Purchase Records', icon: ShoppingCart },
    { id: 'sales', label: 'Sales Records', icon: TrendingUp },
    { id: 'customers', label: 'Customers & Partners', icon: Users },
    { id: 'products', label: 'Products & Varieties', icon: Package },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart2 },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Main Navigation
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-xl ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {/* Strawberry Quick Help Card */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-emerald-50/50 border border-rose-100/80">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🍓</span>
          <span className="text-xs font-bold text-slate-800">Fresh Harvest Note</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Record purchases in the morning harvest and sales shipments immediately to keep accurate daily trading quantities.
        </p>
      </div>
    </aside>
  );
}

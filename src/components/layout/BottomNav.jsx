import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Users,
  MoreHorizontal,
  Package,
  FileBarChart2,
  X,
} from 'lucide-react';

export function BottomNav({ activePage, setActivePage }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const handleTabClick = (id) => {
    setActivePage(id);
    setShowMoreMenu(false);
  };

  const isMoreActive = activePage === 'products' || activePage === 'reports';

  return (
    <>
      {/* Mobile More Sheet / Modal */}
      {showMoreMenu && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-5 pb-24 shadow-2xl border-t border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Additional Modules
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTabClick('products')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  activePage === 'products'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-700 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-3 bg-white rounded-xl shadow-xs text-rose-600">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Products & Varieties</span>
              </button>

              <button
                onClick={() => handleTabClick('reports')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  activePage === 'reports'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-700 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-3 bg-white rounded-xl shadow-xs text-emerald-600">
                  <FileBarChart2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Reports & CSV Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="flex flex-col items-center justify-center py-1 transition-all group"
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 -translate-y-0.5'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] mt-0.5 transition-colors ${
                    isActive ? 'font-bold text-rose-600' : 'font-medium text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="flex flex-col items-center justify-center py-1 transition-all group"
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isMoreActive || showMoreMenu
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 -translate-y-0.5'
                  : 'text-slate-500 group-hover:text-slate-800'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] mt-0.5 transition-colors ${
                isMoreActive || showMoreMenu
                  ? 'font-bold text-rose-600'
                  : 'font-medium text-slate-500'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

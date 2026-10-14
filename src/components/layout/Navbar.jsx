import React from 'react';
import { LogOut, User, Store, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function Navbar({ activePage, setActivePage }) {
  const { user, signOut, isLiveSupabase } = useAuth();
  const { showSuccess } = useToast();

  const handleLogout = async () => {
    await signOut();
    showSuccess('Successfully logged out.');
  };

  const businessName = user?.user_metadata?.business_name || 'Strawberry Farm & Trading';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              🍓
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                  Strawberry
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  Trade
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px] sm:max-w-xs">
                {businessName}
              </p>
            </div>
          </div>

          {/* Right Header Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Database status dot */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isLiveSupabase ? 'Supabase Live' : 'Local Demo'}</span>
            </div>

            {/* User display */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                {user?.email || 'Authenticated Owner'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                <Shield className="w-3 h-3 text-emerald-600" /> RLS Protected
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

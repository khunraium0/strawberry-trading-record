import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Store,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const { signIn, signUp, loginAsDemo, isLiveSupabase } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp({ email, password, businessName });
        showSuccess('Account created! Welcome to Strawberry Trade Record.');
      } else {
        await signIn({ email, password });
        showSuccess('Logged in successfully.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      showError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await loginAsDemo();
      showSuccess('Signed in with Demo Business profile.');
    } catch (err) {
      showError('Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Strawberry Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-600 text-white text-3xl shadow-lg shadow-rose-300/60 mb-3 animate-bounce-subtle">
            🍓
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Strawberry Trading Record
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
            Mobile-first purchasing and sales ledger for fresh strawberry farms, traders, and fruit markets.
          </p>
        </div>

        {/* Auth Box */}
        <div className="mt-8 bg-white py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {/* Sign In / Sign Up Mode Switch */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Farm Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Maymyo Strawberry Orchard"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@strawberrytrade.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode One-Click Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Instant Preview / Offline Demo
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore Demo with Sample Myanmar Data</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Works completely in your browser without requiring Supabase API keys immediately.
            </p>
          </div>
        </div>

        {/* Database Status and Setup helper */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline flex items-center justify-center gap-1 mx-auto"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isLiveSupabase
                ? 'Supabase Cloud Connected (Click to view)'
                : 'Need to connect your own Supabase database?'}
            </span>
          </button>

          {showConfigGuide && (
            <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-2 shadow-xs">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                Supabase PostgreSQL Setup Instructions:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Create a free project at <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">supabase.com</code></li>
                <li>Go to SQL Editor and run the script in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">supabase/schema.sql</code></li>
                <li>Copy Project URL and Anon Public Key from Project Settings &gt; API</li>
                <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env</code></li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

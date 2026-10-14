import React, { useState } from 'react';
import { Database, ShieldCheck, Sparkles, HelpCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';

export function SupabaseStatusBanner() {
  const { isLiveSupabase } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const envSnippet = `VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-actual-anon-key`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          {isLiveSupabase ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Supabase PostgreSQL: Connected & Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Demo Mode Active (Local Storage Persistent)
            </span>
          )}
          <span className="text-slate-400 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline">
            {isLiveSupabase
              ? 'Multi-user RLS security enabled'
              : 'All operations save to your browser storage. Connect Supabase to sync across devices.'}
          </span>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-rose-400" />
          <span>{isLiveSupabase ? 'Database Config' : 'Connect Cloud Database'}</span>
        </button>
      </div>

      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Supabase PostgreSQL Integration"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Database Status
            </h4>
            <p>
              Current Mode:{' '}
              <strong className={isLiveSupabase ? 'text-emerald-600' : 'text-amber-600'}>
                {isLiveSupabase ? 'Cloud Supabase PostgreSQL' : 'Local Persistent Storage (Demo)'}
              </strong>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">Quick 2-Step Supabase Setup:</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>
                <strong>Run Migration SQL:</strong> In your Supabase Dashboard, open <em>SQL Editor</em> and run the complete script from{' '}
                <code className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">supabase/schema.sql</code>. This creates the customers, products, purchases, sales tables and RLS security policies.
              </li>
              <li>
                <strong>Add Environment Variables:</strong> Create or update{' '}
                <code className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">.env</code> in the project root:
              </li>
            </ol>
          </div>

          <div className="relative bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs">
            <pre className="overflow-x-auto">{envSnippet}</pre>
            <button
              onClick={copyToClipboard}
              className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Once saved, restart the Vite dev server with <code className="text-slate-700 bg-slate-100 px-1 rounded">npm run dev</code>. The app will automatically connect to your live database!
          </p>
        </div>
      </Modal>
    </>
  );
}

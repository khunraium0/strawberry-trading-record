import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { SupabaseStatusBanner } from '../common/SupabaseStatusBanner';

export function Layout({ activePage, setActivePage, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner (Status for Supabase Live or Local Demo) */}
      <SupabaseStatusBanner />

      {/* Top Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* App Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar activePage={activePage} setActivePage={setActivePage} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

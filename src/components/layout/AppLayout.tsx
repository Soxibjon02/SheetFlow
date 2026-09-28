import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomBar } from './MobileBottomBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 bg-gradient-to-br from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomBar />
    </div>
  );
};


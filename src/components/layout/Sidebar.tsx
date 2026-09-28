import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
import { useNav } from '../../lib/nav';
import {
  LayoutDashboard,
  FileSpreadsheet,
  LineChart,
  Calculator,
  LayoutGrid,
  FileText,
  Sparkles,
  Settings,
  Briefcase,
  Globe2,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t, lang } = useI18n();
  const { isMobileNavOpen, closeMobileNav } = useNav();

  const coreNavItems = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/sheets', label: t('mySheets'), icon: FileSpreadsheet },
    { to: '/analytics', label: t('analytics'), icon: LineChart },
    { to: '/calculations', label: t('calculations'), icon: Calculator },
    { to: '/dashboards', label: t('dashboards'), icon: LayoutGrid },
  ];

  const moduleNavItems = [
    { to: '/accounting', label: t('accounting'), icon: Briefcase, badge: 'V2' },
    { to: '/economy', label: t('economy'), icon: Globe2, badge: 'V2' },
  ];

  const systemNavItems = [
    { to: '/templates', label: t('templates'), icon: Sparkles },
    { to: '/reports', label: t('reports'), icon: FileText },
    { to: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 md:bg-white/70 md:dark:bg-slate-900/60 backdrop-blur-xl md:backdrop-blur-md flex flex-col justify-between shrink-0 h-full md:min-h-[calc(100vh-4rem)] transition-transform duration-200 ease-in-out overflow-y-auto ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Mobile Header with Close button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              SheetFlow Menyu
            </span>
            <button
              onClick={closeMobileNav}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === 'uz' ? 'Asosiy Menyu' : 'Core Platform'}
            </div>
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Specialized Modules (Accounting & Economy) */}
          <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>{lang === 'uz' ? 'Ixtisoslashgan Modullar' : 'Specialized Modules'}</span>
              <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">
                PRO
              </span>
            </div>
            {moduleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {item.badge}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* System & Workspace */}
          <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === 'uz' ? 'Tizim va Hisobotlar' : 'System & Reports'}
            </div>
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

      {/* Bottom helper card */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/70 dark:from-slate-800/80 dark:to-slate-900/90 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {lang === 'uz' ? 'Kodsiz Dvigatel' : 'No-Code Engine'}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {lang === 'uz'
            ? 'Formulalarsiz guruhlash, hisob-kitob va boshqaruv panellarini yarating.'
            : 'Perform aggregations, calculations, and auto-dashboards without formulas.'}
        </p>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{lang === 'uz' ? 'Google Sheets integratsiyasi' : 'Google Sheets Sync'}</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>
    </aside>
  </>
  );
};

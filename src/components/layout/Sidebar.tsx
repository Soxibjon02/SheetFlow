import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t, lang } = useI18n();

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
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      <div className="p-4 space-y-4">
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
  );
};

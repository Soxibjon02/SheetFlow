import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
import {
  LayoutDashboard,
  FileSpreadsheet,
  LineChart,
  Briefcase,
  Globe2,
} from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const { lang } = useI18n();

  const items = [
    { to: '/dashboard', label: lang === 'uz' ? 'Asosiy' : 'Home', icon: LayoutDashboard },
    { to: '/sheets', label: lang === 'uz' ? 'Jadvallar' : 'Sheets', icon: FileSpreadsheet },
    { to: '/accounting', label: lang === 'uz' ? 'Buxgalteriya' : 'Accounting', icon: Briefcase },
    { to: '/economy', label: lang === 'uz' ? 'Iqtisod' : 'Economy', icon: Globe2 },
    { to: '/analytics', label: lang === 'uz' ? 'Tahlil' : 'Analytics', icon: LineChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

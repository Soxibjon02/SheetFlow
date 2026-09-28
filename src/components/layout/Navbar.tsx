import React from 'react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { Sun, Moon, Globe, CheckCircle2, AlertCircle, Sparkles, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, connectGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Brand logo & tag */}
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-slate-950 font-bold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                SheetFlow
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">No-Code Sheets Analytics</p>
          </div>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {/* Google OAuth Status pill */}
        <div className="hidden md:flex items-center">
          {user?.isGoogleConnected ? (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Google Sheets API Connected</span>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{t('connectGoogleAccount')}</span>
            </button>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              lang === 'en'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('uz')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              lang === 'uz'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            UZ
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email || 'user@sheetflow.io'}</p>
          </div>
        </div>
      </div>
    </header>

  );
};

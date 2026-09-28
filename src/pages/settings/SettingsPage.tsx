import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import {
  User,
  Shield,
  Key,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, connectGoogle, disconnectGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const [notification, setNotification] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState(user?.name || 'Soxibjon');
  const [email, setEmail] = useState(user?.email || 'soxibjon@sheetflow.io');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showNotice(lang === 'uz' ? 'Profil muvaffaqiyatli saqlandi.' : 'Profile updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(lang === 'uz' ? 'Parollar mos kelmadi.' : 'Passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showNotice(lang === 'uz' ? 'Parol xavfsiz tarzda oʻzgartirildi.' : 'Password changed securely.');
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {lang === 'uz' ? `Platforma ${t('settings')}` : `Platform ${t('settings')}`}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'uz'
            ? 'Profil maʼlumotlari, Google OAuth ulanishi, til va tashqi koʻrinish parametrlarini boshqarish'
            : 'Manage your account profile, Google OAuth credentials, language, and theme preferences'}
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Google Account Integration (Section 5 & 28) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('googleAccount')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz'
                  ? 'OAuth 2.0 orqali Google Sheets jadvallarini oʻqish va yozish ruxsatnomalari'
                  : 'Grants read/write permissions for Google Sheets via authorized OAuth 2.0'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white">
                G
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  {user?.isGoogleConnected
                    ? (lang === 'uz' ? 'Google hisobi ulangan' : 'Connected Google Account')
                    : (lang === 'uz' ? 'Ulanmagan' : 'Not Connected')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.isGoogleConnected
                    ? (lang === 'uz' ? 'Ruxsatlar: spreadsheets, email, profile (AES-256 bilan shifrlangan)' : 'Scopes: spreadsheets, email, profile (Token Encrypted with AES-256)')
                    : (lang === 'uz' ? 'Jadval maʼlumotlarini oʻqish va yozish uchun ruxsat bering' : 'Authorize SheetFlow to load & write spreadsheet data')}
                </p>
              </div>
            </div>

            {user?.isGoogleConnected ? (
              <button
                type="button"
                onClick={() => {
                  disconnectGoogle();
                  showNotice(lang === 'uz' ? 'Google hisobi uzildi.' : 'Google account disconnected.');
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-semibold text-xs transition cursor-pointer"
              >
                {lang === 'uz' ? 'Hisobni uzish' : 'Disconnect Account'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  connectGoogle();
                  showNotice(lang === 'uz' ? 'Google hisobi muvaffaqiyatli ulandi.' : 'Google account connected successfully.');
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {t('connectGoogleAccount')}
              </button>
            )}
          </div>
        </div>

        {/* 2. Language & Appearance (Section 28) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'uz' ? 'Mahalliylashtirish va Tashqi Koʻrinish' : 'Localization & Appearance'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Interfeys tili va mavzu rejimini tanlang' : 'Select your preferred interface language and display theme'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('language')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    lang === 'en'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>🇬🇧 English</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('uz')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    lang === 'uz'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>🇺🇿 Oʻzbekcha</span>
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('appearance')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{t('dark')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    theme === 'light'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{t('light')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Profile Information (Section 28) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('profile')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Foydalanuvchi maʼlumotlari va elektron pochta manzili' : 'Account identity and notification address'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Ism sharif' : 'Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Elektron pochta manzili' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
            >
              {t('saveChanges')}
            </button>
          </form>
        </div>

        {/* 4. Security & Password (Section 28) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'uz' ? 'Xavfsizlik va Parol' : 'Security & Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Kriptografik scrypt algoritmi bilan xavfsiz shifrlash' : 'Salted hashing with scrypt cryptographic algorithms'}
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'uz' ? 'Joriy parol' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'uz' ? 'Yangi parol' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'uz' ? 'Yangi parolni tasdiqlang' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
            >
              {lang === 'uz' ? 'Parolni yangilash' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

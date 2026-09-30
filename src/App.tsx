import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { I18nProvider } from './lib/i18n';
import { NavProvider } from './lib/nav';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MySheetsPage } from './pages/sheets/MySheetsPage';
import { SheetDetailPage } from './pages/sheets/SheetDetailPage';
import { SavedAnalysesPage } from './pages/saved-analyses/SavedAnalysesPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <NavProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/sheets" element={<MySheetsPage />} />
                    <Route path="/sheets/:id" element={<SheetDetailPage />} />
                    <Route path="/saved-analyses" element={<SavedAnalysesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </NavProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

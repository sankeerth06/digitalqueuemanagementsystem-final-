import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import { LandingPage } from './pages/LandingPage';
import { NotFound } from './pages/NotFound';
import { TVDisplay } from './pages/TVDisplay';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { OrderPage } from './pages/student/OrderPage';
import { HistoryPage } from './pages/student/HistoryPage';
import { ProfilePage } from './pages/student/ProfilePage';

import { StaffDashboard } from './pages/staff/StaffDashboard';

import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminMenu } from './pages/admin/AdminMenu';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';

import { useThemeStore } from './store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tv" element={<TVDisplay />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/order" element={<OrderPage />} />
              <Route path="/student/history" element={<HistoryPage />} />
              <Route path="/student/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/staff" element={<StaffDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/menu" element={<AdminMenu />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Toaster } from './components/ui/toaster';

// Layout & Guards
import { AppShell } from './components/layout/AppShell';
import { AuthGuard } from './components/auth/AuthGuard';
import { RoleGuard } from './components/auth/RoleGuard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// M2 & M3 Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PaymentListPage } from './pages/payments/PaymentListPage';
import { PaymentDetailPage } from './pages/payments/PaymentDetailPage';
import { CheckoutPage } from './pages/payments/CheckoutPage';
import { RefundDetailPage } from './pages/refunds/RefundDetailPage';

// M4 Pages
import { AdminPage } from './pages/admin/AdminPage';
import { WebhookPage } from './pages/webhooks/WebhookPage';
import { TierGuard } from './components/auth/TierGuard';

export default function App() {
  const { fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (isLoading) return null; // App wide loading state could be better

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/payments" element={<PaymentListPage />} />
          <Route path="/payments/new" element={<CheckoutPage />} />
          <Route path="/payments/:id" element={<PaymentDetailPage />} />
          <Route path="/refunds/:id" element={<RefundDetailPage />} />
          <Route path="/webhooks" element={
            <TierGuard allowedTiers={['paid']}>
              <WebhookPage />
            </TierGuard>
          } />
          <Route path="/admin/users" element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminPage />
            </RoleGuard>
          } />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

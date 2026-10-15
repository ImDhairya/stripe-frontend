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
import { TelemetryPage } from './pages/telemetry/TelemetryPage';
import { TierGuard } from './components/auth/TierGuard';

export default function App() {
  const { fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="space-y-1">
            <h3 className="font-semibold text-lg tracking-tight">Connecting to PayGate</h3>
            <p className="text-xs text-muted-foreground">
              Initializing secure session...
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/70 bg-muted/50 p-2.5 rounded border border-border/50">
            Render Free Tier cold start: if the backend was inactive, it may take 45–60 seconds to spin up.
          </p>
        </div>
      </div>
    );
  }

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
          <Route path="/telemetry" element={<TelemetryPage />} />
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

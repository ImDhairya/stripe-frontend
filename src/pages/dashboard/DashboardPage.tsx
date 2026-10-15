import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { QuotaWarning } from '../../components/shared/QuotaWarning';
import { paymentsApi, type Payment, type PaymentStats } from '../../api/payments';
import { searchApi } from '../../api/search';
import { systemApi, type SystemTelemetry } from '../../api/system';
import { formatCurrency } from '../../lib/utils';
import {
  Activity,
  DollarSign,
  Lock,
  Radio,
  Plus,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [statsRes, paymentsRes, auditRes, telemetryRes] = await Promise.allSettled([
          paymentsApi.getStats(),
          searchApi.search<Payment>('payments', { limit: 5, sort: 'desc' }),
          searchApi.search<AuditLogItem>('audit-logs', { limit: 5, sort: 'desc' }),
          systemApi.getTelemetry(),
        ]);

        if (!isMounted) return;

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data || (statsRes.value as any));
        }

        if (paymentsRes.status === 'fulfilled') {
          setRecentPayments(paymentsRes.value.data || []);
        }

        if (auditRes.status === 'fulfilled') {
          setRecentAuditLogs(auditRes.value.data || []);
        }

        if (telemetryRes.status === 'fulfilled') {
          setTelemetry(telemetryRes.value.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <QuotaWarning />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time overview of your payment volume, manual holds, and transaction engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/telemetry')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Observability & Audit
          </Button>
          <Button onClick={() => navigate('/payments/new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Payment
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-muted/40 rounded-lg text-sm text-muted-foreground animate-pulse flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          Loading true database aggregations and telemetry...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Settled Volume
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats ? formatCurrency(stats.settledVolume, 'inr') : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.successfulPayments ?? 0} successful / captured transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Authorized Hold Volume
            </CardTitle>
            <Lock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats ? formatCurrency(stats.authorizedVolume, 'inr') : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.authorizedPayments ?? 0} manual holds waiting for capture
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engine Success Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats?.successRate ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalPayments ?? 0} total ({stats?.failedPayments ?? 0} failed, {stats?.refundedPayments ?? 0} refunded)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Webhook & Queue Health
            </CardTitle>
            <Radio className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-500">
              {telemetry ? `${telemetry.webhookLagSeconds.toFixed(2)}s lag` : 'Active'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              BullMQ Outbound: {telemetry?.queues?.outbound?.completed ?? 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Recent Transactions and Audit Trail */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest 5 payments processed</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/payments')}
              className="text-xs flex items-center gap-1 hover:text-primary"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatCurrency(p.amount, p.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-xs uppercase text-muted-foreground">
                        {p.processor}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/payments/${p.id}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Immutable Audit Logs */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Audit Logs</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Immutable audit trail of actions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/telemetry')}
              className="text-xs flex items-center gap-1 hover:text-primary"
            >
              Full explorer <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentAuditLogs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No audit entries recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.resourceType}: <span className="font-mono">{log.resourceId.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

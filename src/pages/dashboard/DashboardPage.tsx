import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { searchApi } from '../../api/search';
import type { Payment } from '../../api/payments';
import { Activity, DollarSign, CreditCard, XCircle } from 'lucide-react';
import { QuotaWarning } from '../../components/shared/QuotaWarning';

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalVolume: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await searchApi.search<Payment>('payments', { limit: 100 });
        const payments = res.data || [];
        
        const total = payments.length;
        const successful = payments.filter(p => p.status === 'succeeded').length;
        const failed = payments.filter(p => p.status === 'failed').length;
        const volume = payments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalPayments: total,
          successfulPayments: successful,
          failedPayments: failed,
          totalVolume: volume,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <QuotaWarning />
      {isLoading && <p className="text-muted-foreground animate-pulse">Loading dashboard stats...</p>}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your payment activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalVolume / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.successfulPayments} successful payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPayments > 0 
                ? Math.round((stats.successfulPayments / stats.totalPayments) * 100) 
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

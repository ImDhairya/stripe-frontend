import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Payment } from '../../api/payments';
import { searchApi } from '../../api/search';
import { SearchBar } from '../../components/shared/SearchBar';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { QuotaWarning } from '../../components/shared/QuotaWarning';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Plus, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function PaymentListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const limit = 10;

  useEffect(() => {
    let isMounted = true;

    const fetchPayments = async () => {
      try {
        const res = await searchApi.search<Payment>('payments', {
          q: query,
          limit,
          offset,
          sort,
        });

        if (!isMounted) return;
        setPayments(res.data || []);
        setTotal(res.pagination?.total ?? (res as any).total ?? 0);
        setHasMore(res.pagination?.hasMore ?? (res as any).hasMore ?? false);
      } catch (error) {
        console.error('Failed to fetch payments', error);
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, [query, offset, limit, sort]);

  const toggleSort = () => {
    setSort((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setOffset(0);
  };

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setOffset(0);
  }, []);

  return (
    <div className="space-y-6">
      <QuotaWarning />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">Manage and view all your transactions.</p>
        </div>
        <Button onClick={() => navigate('/payments/new')} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Payment
        </Button>
      </div>

      <div className="bg-card rounded-md border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search payments by ID, status, currency, or processor..."
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className="flex items-center gap-1.5 text-xs font-medium"
              title="Toggle ascending / descending date sort"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
              {sort === 'desc' ? 'Newest First (Desc)' : 'Oldest First (Asc)'}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead
                onClick={toggleSort}
                className="cursor-pointer select-none hover:text-primary transition-colors"
                title="Click to toggle sorting order"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {sort === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground text-xs font-mono">
                    {payment.processor}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-primary hover:underline font-medium">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          offset={offset}
          limit={limit}
          total={total}
          hasMore={hasMore}
          onPageChange={setOffset}
        />
      </div>
    </div>
  );
}

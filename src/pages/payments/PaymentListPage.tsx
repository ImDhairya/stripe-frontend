import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Payment } from '../../api/payments';
import { searchApi } from '../../api/search';
import { SearchBar } from '../../components/shared/SearchBar';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { QuotaWarning } from '../../components/shared/QuotaWarning';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

export function PaymentListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const limit = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await searchApi.search<Payment>('payments', { q: query, limit, offset });
        setPayments(res.data || []);
        setTotal(res.total || 0);
        setHasMore(res.hasMore || false);
      } catch (error) {
        console.error('Failed to fetch payments', error);
      }
    };

    fetchPayments();
  }, [query, offset, limit]);

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

      <div className="bg-card rounded-md border">
        <div className="p-4 border-b">
          <SearchBar onSearch={(q) => { setQuery(q); setOffset(0); }} placeholder="Search payments by ID..." />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Date</TableHead>
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
                  <TableCell className="font-medium">
                    ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="capitalize">{payment.processor}</TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
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

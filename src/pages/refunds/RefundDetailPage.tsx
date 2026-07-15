import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { type Refund, refundsApi } from '../../api/refunds';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRefund = async () => {
      try {
        if (!id) return;
        const data = await refundsApi.get(id);
        setRefund(data);
      } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to load refund', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRefund();
  }, [id, toast]);

  if (isLoading) return <div>Loading...</div>;
  if (!refund) return <div>Refund not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-destructive">
            -${(refund.amount / 100).toFixed(2)}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">ID: {refund.id}</p>
        </div>
        <StatusBadge status={refund.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Refund Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium">{new Date(refund.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Original Payment</span>
              <Link to={`/payments/${refund.paymentId}`} className="text-blue-500 hover:underline flex items-center">
                {refund.paymentId}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

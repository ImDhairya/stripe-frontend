import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Payment, paymentsApi } from '../../api/payments';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        if (!id) return;
        const response: any = await paymentsApi.get(id);
        setPayment(response.data.payment);
      } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to load payment', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [id, toast]);

  const handleCapture = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const updated: any = await paymentsApi.capture(id);
      setPayment(updated.data.payment);
      toast({ title: 'Success', description: 'Payment captured successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to capture payment', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      const updated: any = await paymentsApi.cancel(id);
      setPayment(updated.data.payment);
      toast({ title: 'Success', description: 'Payment canceled successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel payment', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await paymentsApi.refund(id);
      const response: any = await paymentsApi.get(id);
      setPayment(response.data.payment);
      toast({ title: 'Success', description: 'Refund issued successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to issue refund', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };


  if (isLoading) return <div>Loading...</div>;
  if (!payment) return <div>Payment not found</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/payments')} className="pl-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Payments
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">ID: {payment.id}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Processor</span>
              <span className="capitalize font-medium">{payment.processor}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium">{new Date(payment.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium">{payment.description || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payment.status === 'requires_payment_method' && (
              <>
                <Button 
                  onClick={handleCapture} 
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Capture Payment
                </Button>
                <Button 
                  onClick={handleCancel} 
                  disabled={isProcessing}
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  Cancel Payment
                </Button>
              </>
            )}
            {payment.status === 'succeeded' && (
              <Button 
                onClick={handleRefund}
                disabled={isProcessing}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Issue Refund
              </Button>
            )}
            {payment.status !== 'requires_payment_method' && payment.status !== 'succeeded' && (
              <p className="text-muted-foreground text-sm text-center py-4">No actions available for this state.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

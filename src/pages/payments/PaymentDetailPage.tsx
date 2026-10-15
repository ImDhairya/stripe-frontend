import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Payment, paymentsApi } from '../../api/payments';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { ArrowLeft, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Partial capture and refund inputs
  const [captureAmount, setCaptureAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('customer_requested');

  const fetchPayment = async () => {
    try {
      if (!id) return;
      const res: any = await paymentsApi.get(id);
      const p = res.data?.payment || res.payment || res;
      setPayment(p);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load payment', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const handleCapture = async () => {
    if (!id || !payment) return;
    setIsProcessing(true);
    try {
      const parsedAmount = captureAmount ? Math.round(parseFloat(captureAmount) * 100) : undefined;
      const updated: any = await paymentsApi.capture(id, parsedAmount);
      const newPayment = updated.data?.payment || updated.payment || updated;
      setPayment(newPayment);
      setCaptureAmount('');
      toast({ title: 'Success', description: 'Payment captured successfully.' });
      fetchPayment();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to capture payment', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to cancel this payment authorization?')) return;
    setIsProcessing(true);
    try {
      const updated: any = await paymentsApi.cancel(id);
      const newPayment = updated.data?.payment || updated.payment || updated;
      setPayment(newPayment);
      toast({ title: 'Success', description: 'Payment authorization canceled.' });
      fetchPayment();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel payment', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!id || !payment) return;
    setIsProcessing(true);
    try {
      const parsedAmount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
      await paymentsApi.refund(id, parsedAmount, refundReason);
      setRefundAmount('');
      toast({ title: 'Success', description: 'Refund issued successfully.' });
      fetchPayment();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to issue refund', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading payment details...</div>;
  }

  if (!payment) {
    return <div className="p-8 text-center text-destructive">Payment not found.</div>;
  }

  const numericAmount = Number(payment.amount || 0);
  const numericCaptured = Number(payment.capturedAmount || 0);
  const numericRefunded = Number(payment.refundedAmount || 0);
  const effectiveMaxCapture = numericAmount / 100;
  const refundableRemaining = Math.max(0, (numericCaptured > 0 ? numericCaptured : numericAmount) - numericRefunded) / 100;

  // Determine state machine stepper steps
  const steps = [
    { key: 'created', label: '1. Created', status: 'completed' },
    {
      key: 'authorized',
      label: '2. Authorized',
      status: payment.status === 'failed' && !numericCaptured
        ? 'skipped'
        : payment.status === 'authorized'
        ? 'current'
        : ['succeeded', 'refunded', 'cancelled'].includes(payment.status)
        ? 'completed'
        : 'pending',
    },
    {
      key: 'captured',
      label: '3. Captured / Succeeded',
      status: payment.status === 'succeeded'
        ? 'completed'
        : payment.status === 'refunded'
        ? 'completed'
        : payment.status === 'failed'
        ? 'failed'
        : payment.status === 'cancelled'
        ? 'cancelled'
        : 'pending',
    },
    {
      key: 'refunded',
      label: '4. Refunded',
      status: payment.status === 'refunded'
        ? 'completed'
        : numericRefunded > 0
        ? 'partially_completed'
        : 'pending',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-4">
      <Button variant="ghost" onClick={() => navigate('/payments')} className="pl-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Payments
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-lg border">
        <div>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
            Transaction Details
          </span>
          <h2 className="text-3xl font-bold tracking-tight mt-1">
            {formatCurrency(payment.amount, payment.currency)}
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Payment ID: <span className="text-foreground">{payment.id}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={payment.status} />
        </div>
      </div>

      {/* State Machine Stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lifecycle State Machine</CardTitle>
          <CardDescription>Visual state transitions for this transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((s) => {
              const isCompleted = s.status === 'completed';
              const isCurrent = s.status === 'current';
              const isFailed = s.status === 'failed' || s.status === 'cancelled';

              return (
                <div
                  key={s.key}
                  className={`p-3 rounded-lg border text-sm flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : isFailed
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                      : 'bg-muted/40 border-muted text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <Circle className="h-4 w-4 shrink-0 fill-blue-500 text-blue-500 animate-pulse" />
                    ) : isFailed ? (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-xs">
            <div>
              <span className="text-muted-foreground">Captured Hold Volume:</span>
              <p className="font-semibold text-sm mt-0.5">
                {formatCurrency(payment.capturedAmount || 0, payment.currency)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Refunded Volume:</span>
              <p className="font-semibold text-sm mt-0.5">
                {formatCurrency(payment.refundedAmount || 0, payment.currency)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Idempotency Key:</span>
              <p className="font-mono text-xs truncate mt-0.5" title={payment.idempotencyKey || 'None'}>
                {payment.idempotencyKey || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details & Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payment Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Processor</span>
              <span className="capitalize font-medium">{payment.processor}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Processor ID</span>
              <span className="font-mono text-xs truncate max-w-[200px]" title={payment.processorPaymentId}>
                {payment.processorPaymentId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium">{new Date(payment.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Updated At</span>
              <span className="font-medium">{new Date(payment.updatedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium">
                {(payment.metadata as any)?.description || payment.description || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Gateway Action Console</CardTitle>
            <CardDescription>Trigger state transitions for this transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case 1: Authorized (or requires_payment_method) -> Manual Capture or Cancel */}
            {(payment.status === 'authorized' || payment.status === 'requires_payment_method') && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-700 dark:text-blue-300">
                  This transaction is in <strong>{payment.status}</strong> hold state. You can capture funds (full or partial) or cancel the authorization hold.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captureAmount" className="text-xs">
                    Capture Amount (Optional partial capture, max {formatCurrency(payment.amount, payment.currency)})
                  </Label>
                  <Input
                    id="captureAmount"
                    type="number"
                    step="0.01"
                    max={effectiveMaxCapture}
                    placeholder={`Full amount: ${(numericAmount / 100).toFixed(2)}`}
                    value={captureAmount}
                    onChange={(e) => setCaptureAmount(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleCapture} 
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isProcessing ? 'Processing...' : 'Capture Payment'}
                </Button>

                <Button 
                  onClick={handleCancel} 
                  disabled={isProcessing}
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  Cancel Authorization
                </Button>
              </div>
            )}

            {/* Case 2: Succeeded -> Issue Refund */}
            {payment.status === 'succeeded' && refundableRemaining > 0 && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 dark:text-amber-300">
                  Payment has settled. Remaining refundable balance:{' '}
                  <strong>{formatCurrency(refundableRemaining * 100, payment.currency)}</strong>.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundAmount" className="text-xs">
                    Refund Amount (Optional partial refund, max {formatCurrency(refundableRemaining * 100, payment.currency)})
                  </Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    max={refundableRemaining}
                    placeholder={`Full remaining: ${refundableRemaining.toFixed(2)}`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundReason" className="text-xs">Refund Reason</Label>
                  <select
                    id="refundReason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="customer_requested">Customer Requested</option>
                    <option value="duplicate">Duplicate Transaction</option>
                    <option value="fraudulent">Fraudulent</option>
                  </select>
                </div>

                <Button 
                  onClick={handleRefund}
                  disabled={isProcessing}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isProcessing ? 'Processing Refund...' : 'Issue Refund'}
                </Button>
              </div>
            )}

            {/* Terminal States */}
            {payment.status === 'refunded' && (
              <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                This transaction has been fully refunded. No further operations permitted.
              </div>
            )}

            {payment.status === 'cancelled' && (
              <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                This authorization hold was cancelled. No charges were captured.
              </div>
            )}

            {payment.status === 'failed' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-md text-center text-sm text-rose-600 dark:text-rose-400">
                Payment attempt failed.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { useToast } from '../../hooks/use-toast';
import { paymentsApi } from '../../api/payments';
import { StripeCheckout } from '../../components/checkout/StripeCheckout';
import { DummyCheckout } from '../../components/checkout/DummyCheckout';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function CheckoutPage() {
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('usd');
  const [processor, setProcessor] = useState<'stripe' | 'dummy'>('stripe');
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [paymentSession, setPaymentSession] = useState<{ id: string; clientSecret?: string; processor: string } | null>(null);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    try {
      const idempotencyKey = uuidv4();
      const payload = {
        amount: Math.round(parseFloat(amount) * 100),
        currency,
        processor,
      };
      
      const payment: any = await paymentsApi.create(payload, idempotencyKey);
      
      const paymentData = payment.data.payment;
      setPaymentSession({
        id: paymentData.id,
        clientSecret: paymentData.metadata?.clientSecret, 
        processor: paymentData.processor,
      });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to initialize payment', variant: 'destructive' });
    } finally {
      setIsInitializing(false);
    }
  };

  if (paymentSession) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-8">
        <Button variant="ghost" onClick={() => setPaymentSession(null)} className="pl-0 hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel & Go Back
        </Button>

        <div>
          <h2 className="text-3xl font-bold tracking-tight">Complete Payment</h2>
          <p className="text-muted-foreground">Amount: ${amount} {currency.toUpperCase()}</p>
        </div>

        {paymentSession.processor === 'stripe' && paymentSession.clientSecret ? (
          <StripeCheckout clientSecret={paymentSession.clientSecret} paymentId={paymentSession.id} />
        ) : paymentSession.processor === 'dummy' ? (
          <DummyCheckout paymentId={paymentSession.id} />
        ) : (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            Error initializing processor. Missing client secret for Stripe.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Payment</h2>
        <p className="text-muted-foreground">Create a payment and select your processor.</p>
      </div>

      <form onSubmit={handleCreatePayment} className="space-y-6 bg-card border p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input 
              type="number" 
              step="0.01" 
              min="0.50" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Select Processor</Label>
          <RadioGroup value={processor} onValueChange={(v: any) => setProcessor(v)}>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="stripe" id="r1" />
              <Label htmlFor="r1" className="flex-1 cursor-pointer">Stripe (Real Processor)</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="dummy" id="r2" />
              <Label htmlFor="r2" className="flex-1 cursor-pointer">Dummy (Simulation)</Label>
            </div>
          </RadioGroup>
        </div>

        <Button type="submit" disabled={isInitializing} className="w-full">
          {isInitializing ? 'Initializing...' : 'Proceed to Checkout'}
        </Button>
      </form>
    </div>
  );
}

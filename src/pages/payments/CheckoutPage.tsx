import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { useToast } from '../../hooks/use-toast';
import { paymentsApi } from '../../api/payments';
import { StripeCheckout } from '../../components/checkout/StripeCheckout';
import { DummyCheckout } from '../../components/checkout/DummyCheckout';
import { ArrowLeft, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../lib/utils';

export function CheckoutPage() {
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('inr');
  const [processor, setProcessor] = useState<'stripe' | 'dummy'>('dummy');
  const [captureMethod, setCaptureMethod] = useState<'automatic' | 'manual'>('automatic');
  const [description, setDescription] = useState('');
  
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
        captureMethod,
        description: description.trim() || undefined,
      };
      
      const res: any = await paymentsApi.create(payload, idempotencyKey);
      const paymentData = res.data?.payment || res.payment || res;
      
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
          <p className="text-muted-foreground">
            Amount: {formatCurrency(Math.round(parseFloat(amount) * 100), currency)}
          </p>
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
        <p className="text-muted-foreground">Create a payment and select your processor & capture flow.</p>
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
              <option value="inr">INR (₹)</option>
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Input 
            type="text" 
            placeholder="e.g. Citizen Service Fee / Order #4021"
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            maxLength={255}
          />
        </div>

        <div className="space-y-3">
          <Label>Capture Method</Label>
          <RadioGroup value={captureMethod} onValueChange={(v: any) => setCaptureMethod(v)}>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="automatic" id="cm1" />
              <div className="flex-1 cursor-pointer">
                <Label htmlFor="cm1" className="cursor-pointer font-medium">Automatic (Immediate Charge)</Label>
                <p className="text-xs text-muted-foreground">Funds are captured immediately upon authorization.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="manual" id="cm2" />
              <div className="flex-1 cursor-pointer">
                <Label htmlFor="cm2" className="cursor-pointer font-medium">Manual (Authorize Hold Only)</Label>
                <p className="text-xs text-muted-foreground">Places an authorized hold. You can capture or cancel manually later.</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Select Processor</Label>
          <RadioGroup value={processor} onValueChange={(v: any) => setProcessor(v)}>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="dummy" id="r2" />
              <div className="flex-1 cursor-pointer">
                <Label htmlFor="r2" className="cursor-pointer font-medium">Dummy (Simulation)</Label>
                <p className="text-xs text-muted-foreground">Deterministic local test engine with no external API calls.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-secondary/50 cursor-pointer">
              <RadioGroupItem value="stripe" id="r1" />
              <div className="flex-1 cursor-pointer">
                <Label htmlFor="r1" className="cursor-pointer font-medium">Stripe (Real Processor)</Label>
                <p className="text-xs text-muted-foreground">Uses test-mode Stripe PaymentIntents API.</p>
              </div>
            </div>
          </RadioGroup>

          {processor === 'dummy' && (
            <div className="flex items-start space-x-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Enter an amount ending in <strong>.99</strong> (e.g., <strong>10.99</strong>) to deterministically simulate a processor decline.
              </span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={isInitializing} className="w-full">
          {isInitializing ? 'Initializing...' : 'Proceed to Checkout'}
        </Button>
      </form>
    </div>
  );
}

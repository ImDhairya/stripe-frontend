import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DummyCheckoutProps {
  paymentId: string;
}

export function DummyCheckout({ paymentId }: DummyCheckoutProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Success', description: 'Dummy payment processed successfully!' });
      navigate(`/payments/${paymentId}`);
    } catch (error: any) {
      toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-card border p-6 rounded-lg shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Pay with Dummy Processor</h3>
        <p className="text-sm text-muted-foreground mt-1">This is a simulated payment gateway for testing.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Card Number</Label>
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Expiry</Label>
            <Input defaultValue="12/28" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>CVC</Label>
            <Input defaultValue="123" className="font-mono" />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSimulatePayment}
        disabled={isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isProcessing ? 'Processing...' : 'Simulate Payment'}
      </Button>
    </div>
  );
}

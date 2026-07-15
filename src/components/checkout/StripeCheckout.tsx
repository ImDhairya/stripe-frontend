import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';


const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(PK || 'pk_test_placeholder');

// --- Original PaymentElement Implementation (Commented out as requested) ---
// function CheckoutForm({ paymentId }: { paymentId: string }) {
//   const stripe = useStripe();
//   const elements = useElements();
//   const { toast } = useToast();
//
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isReady, setIsReady] = useState(false);
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!stripe || !elements) return;
//     setIsProcessing(true);
//     try {
//       const { error } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           return_url: `${window.location.origin}/payments/${paymentId}`,
//         },
//       });
//       if (error) {
//         toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
//         setIsProcessing(false);
//       }
//     } catch (err: any) {
//       toast({ title: 'System Error', description: err.message, variant: 'destructive' });
//       setIsProcessing(false);
//     }
//   };
//
//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <PaymentElement onReady={() => setIsReady(true)} />
//       <Button type="submit" disabled={!stripe || !isReady || isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
//         {isProcessing ? 'Processing...' : 'Pay Now'}
//       </Button>
//     </form>
//   );
// }

function CheckoutForm({ paymentId, clientSecret }: { paymentId: string; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Since confirmCardPayment does not auto-redirect like confirmPayment does,
        // we manually redirect upon success.
        window.location.href = `${window.location.origin}/payments/${paymentId}`;
      }
    } catch (err: any) {
      toast({ title: 'System Error', description: err.message || 'An unexpected error occurred', variant: 'destructive' });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-md bg-background">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#fff',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#ef4444' },
          },
        }} />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  paymentId: string;
}

export function StripeCheckout({ clientSecret, paymentId }: StripeCheckoutProps) {
  if (!PK || PK === 'pk_test_placeholder') {
    return (
      <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg text-destructive space-y-2">
        <h3 className="font-bold text-lg">Missing Stripe Publishable Key</h3>
        <p>Please paste your <code>pk_test_...</code> key into <code>frontend/.env</code>, save the file, and restart the frontend server.</p>
      </div>
    );
  }

  const options = React.useMemo(() => ({
    clientSecret,
    appearance: { theme: 'night' as const }
  }), [clientSecret]);

  return (
    <div className="bg-card border p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Pay with Stripe</h3>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm paymentId={paymentId} clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}

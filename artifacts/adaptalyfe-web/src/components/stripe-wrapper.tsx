import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode, useEffect, useState } from 'react';

let stripePromise: Promise<any> | null = null;

// Only initialize Stripe when needed and handle errors gracefully
const getStripe = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY).catch((error) => {
      console.warn('Stripe failed to load:', error);
      return null;
    });
  }
  return stripePromise;
};

interface StripeWrapperProps {
  children: ReactNode;
  clientSecret?: string;
  onStripeLoadError?: () => void;
}

export function StripeWrapper({ children, clientSecret, onStripeLoadError }: StripeWrapperProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadStripeInstance = async () => {
      try {
        const stripeInstance = await getStripe();
        if (stripeInstance) {
          setStripe(stripeInstance);
        } else {
          setError(true);
          onStripeLoadError?.();
        }
      } catch (err) {
        console.warn('Failed to load Stripe:', err);
        setError(true);
        onStripeLoadError?.();
      } finally {
        setLoading(false);
      }
    };

    loadStripeInstance();
  }, [onStripeLoadError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !stripe) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Payment system is temporarily unavailable.</p>
        {children}
      </div>
    );
  }

  const options = clientSecret ? { clientSecret } : {};

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}
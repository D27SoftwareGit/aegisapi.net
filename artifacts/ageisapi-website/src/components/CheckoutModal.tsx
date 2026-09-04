import { useCallback, useEffect, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface CheckoutModalProps {
  sku: string;
  publishableKey: string;
  onClose: () => void;
}

export function CheckoutModal({ sku, publishableKey, onClose }: CheckoutModalProps) {
  const { getToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const token = await getToken();
    const origin = window.location.origin;
    const returnUrl = `${origin}${BASE}/account?checkout=return&session_id={CHECKOUT_SESSION_ID}`;

    const res = await fetch(`${BASE}/licensing/stripe/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sku, returnUrl }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "checkout_failed");
      throw new Error(data.error ?? "checkout_failed");
    }

    return data.clientSecret as string;
  }, [sku, getToken]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Complete your purchase</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-1">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive">Something went wrong starting checkout. Please try again.</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              stripe={getStripe(publishableKey)}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  );
}

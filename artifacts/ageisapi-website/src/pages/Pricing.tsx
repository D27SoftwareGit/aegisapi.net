import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutModal } from "@/components/CheckoutModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SkuPrice {
  name: string;
  calls: number;
  tier: string;
  cents: number;
  dollars: string;
}

interface PricingData {
  prices: Record<string, SkuPrice>;
  publishableKey: string;
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function PriceSkeleton() {
  return <span className="inline-block h-6 w-16 animate-pulse rounded bg-muted" />;
}

function usePricing() {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/licensing/pricing`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

const CALL_PACKAGE_SKUS = ["call_20", "call_50", "call_200", "call_400"] as const;

export default function Pricing() {
  const { data, loading } = usePricing();
  const { isSignedIn } = useAuth();
  const [, navigate] = useLocation();
  const [checkoutSku, setCheckoutSku] = useState<string | null>(null);

  function openCheckout(sku: string) {
    if (!isSignedIn) {
      navigate("/sign-up");
      return;
    }
    setCheckoutSku(sku);
  }

  return (
    <>
      {checkoutSku && data?.publishableKey && (
        <CheckoutModal
          sku={checkoutSku}
          publishableKey={data.publishableKey}
          onClose={() => setCheckoutSku(null)}
        />
      )}

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple pricing. No surprise fees.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Start free. Pay per call if you use it lightly, or go unlimited if
            AegisAPI becomes part of your daily workflow.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-border/60 bg-card px-8 py-8 sm:flex-row">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-semibold text-foreground">Free Trial</h2>
              <span className="text-sm text-muted-foreground">No credit card required</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              20 API calls or 7 days, whichever comes first, on us.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="ml-1.5 text-sm text-muted-foreground">/ 20 calls or 7 days</span>
            </div>
            <Button asChild size="lg">
              <Link href="/download">Start free trial</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-8">
            <h3 className="text-lg font-semibold text-foreground">Call Packages</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pay once for a fixed block of API calls. Valid for 12 months from
              purchase — remaining calls can be carried forward with a
              maintenance renewal if you don't use them in time.
            </p>

            <div className="mt-6 flex-1 space-y-2.5">
              {CALL_PACKAGE_SKUS.map((sku) => {
                const p = data?.prices[sku];
                return (
                  <div
                    key={sku}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {loading ? <PriceSkeleton /> : `${p?.calls ?? "?"} API calls`}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-foreground">
                        {loading ? <PriceSkeleton /> : `$${p?.dollars ?? "—"}`}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading || !p || checkoutSku === sku}
                        onClick={() => openCheckout(sku)}
                      >
                        {checkoutSku === sku ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Buy"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              You'll need a free account to purchase.
            </p>
          </div>

          <div className="relative flex flex-col rounded-2xl border border-primary/60 bg-card p-8 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]">
            <Badge className="mb-3 w-fit" variant="default">
              Most popular
            </Badge>
            <h3 className="text-lg font-semibold text-foreground">Yearly</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-foreground">
                {loading ? <PriceSkeleton /> : `$${data?.prices.yearly?.dollars ?? "—"}`}
              </span>
              <span className="text-sm text-muted-foreground">/ 12 months</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Unlimited API calls for a full year, billed annually.
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              <Feature>Unlimited API calls</Feature>
              <Feature>Priority license support</Feature>
              <Feature>
                Bug-fix releases we ship during the year, plus any features that
                happen to ship — new functionality is not guaranteed. The app
                does not auto-update.
              </Feature>
              <Feature>One physical PC</Feature>
            </ul>

            <Button
              className="mt-8 w-full"
              disabled={loading || !data?.prices.yearly || checkoutSku === "yearly"}
              onClick={() => openCheckout("yearly")}
            >
              {checkoutSku === "yearly" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening…</>
              ) : (
                "Buy yearly — unlimited calls"
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You'll need a free account to purchase.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-8">
            <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-foreground">Custom</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Multi-seat licensing and dedicated support for teams.
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              <Feature>Volume machine bindings</Feature>
              <Feature>Centralized license management</Feature>
              <Feature>Dedicated support channel</Feature>
              <Feature>Custom procurement &amp; invoicing</Feature>
            </ul>

            <Button asChild variant="outline" className="mt-8 w-full">
              <a href="mailto:sales@aegisapi.net">Contact sales</a>
            </Button>
          </div>
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            One physical PC per license. Extra Windows logins on that PC are
            not extra seats. The key cannot move to another machine.
          </p>
        </div>
      </div>
    </>
  );
}

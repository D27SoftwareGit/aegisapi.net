import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, KeyRound, ShoppingBag, PartyPopper, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface License {
  id: number;
  licenseKey: string | null;
  status: string;
  packCallBalance: number;
  boundAt: string | null;
  linkedAt: string;
}

interface Purchase {
  id: number;
  token: string | null;
  tier: string;
  callBalance: number;
  pricePaidCents: number;
  priceDollars: string;
  redeemed: boolean;
  redeemedAt: string | null;
  licenseExpiresAt: string;
  purchasedAt: string;
}

function CopyButton({ text, size = "default" }: { text: string; size?: "default" | "sm" }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className={size === "sm" ? "h-7 w-7 shrink-0" : "h-8 w-8 shrink-0"}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function statusBadge(status: string) {
  if (status === "bound") {
    return "bg-green-500/15 text-green-400 border-green-500/20";
  }
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
}

function tierLabel(tier: string, callBalance: number) {
  if (tier === "yearly") return "Yearly Unlimited";
  return `Call Package — ${callBalance} calls`;
}

function LicensesTab() {
  const { getToken } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${BASE}/licensing/account/licenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLicenses(data.licenses ?? []);
      } catch {
        setError("Failed to load licenses. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading licenses…</div>;
  if (error) return <div className="flex items-center justify-center py-16 text-destructive text-sm">{error}</div>;

  if (licenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <KeyRound className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-foreground">No activated licenses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase a license and activate it in the app — it will appear here.
          </p>
        </div>
        <Button asChild size="sm" className="mt-2">
          <a href={`${BASE}/pricing`}>View pricing</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {licenses.map((lic) => (
        <Card key={lic.id} className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">License key</CardTitle>
              <Badge variant="outline" className={`text-xs capitalize ${statusBadge(lic.status)}`}>
                {lic.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lic.licenseKey ? (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <code className="flex-1 truncate font-mono text-xs text-foreground">{lic.licenseKey}</code>
                <CopyButton text={lic.licenseKey} size="sm" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Key unavailable</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Call pack size: <span className="text-foreground font-medium">{lic.packCallBalance}</span></span>
              {lic.boundAt && <span>Bound: <span className="text-foreground">{new Date(lic.boundAt).toLocaleDateString()}</span></span>}
              <span>Added: <span className="text-foreground">{new Date(lic.linkedAt).toLocaleDateString()}</span></span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Redeem dialog ─────────────────────────────────────────────────────────────

interface RedeemDialogProps {
  purchase: Purchase;
  open: boolean;
  onClose: () => void;
  onRedeemed: (licenseKey: string) => void;
}

function RedeemDialog({ purchase, open, onClose, onRedeemed }: RedeemDialogProps) {
  const { getToken } = useAuth();
  const [machineId, setMachineId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(v: boolean) {
    if (!v) { onClose(); setMachineId(""); setError(null); }
  }

  async function submit() {
    const mid = machineId.trim();
    if (!mid || busy || !purchase.token) return;
    setBusy(true); setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/licensing/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: purchase.token, machineId: mid }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          token_not_found_or_already_redeemed: "This token has already been used or was not found.",
          token_expired: "This purchase token has expired.",
          unauthorized: "Authentication error. Please sign in again.",
        };
        throw new Error(msgs[data.error] ?? data.error ?? "Unknown server error");
      }
      onRedeemed(data.licenseKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Get your license key</DialogTitle>
          <DialogDescription>
            Open AegisAPI on your computer, copy your Machine ID from the License tab, then paste it here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground block mb-1">Where to find your Machine ID:</strong>
            Open AegisAPI → License (key icon in sidebar) → copy the long ID shown under "Machine ID"
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Machine ID</label>
            <input
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="XXXXXXXX-XXXXXXXX-…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={!machineId.trim() || busy} onClick={submit}>
            {busy ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating key…</> : "Generate license key"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Issued key dialog (shown after redemption) ────────────────────────────────

interface IssuedKeyDialogProps {
  licenseKey: string;
  open: boolean;
  onClose: () => void;
}

function IssuedKeyDialog({ licenseKey, open, onClose }: IssuedKeyDialogProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" /> License key ready
          </DialogTitle>
          <DialogDescription>
            Copy this key and paste it into AegisAPI → License tab → Activate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <code className="block break-all font-mono text-xs text-foreground leading-relaxed">{licenseKey}</code>
          </div>

          <Button className="w-full" onClick={copy} variant={copied ? "outline" : "default"}>
            {copied
              ? <><Check className="mr-2 h-4 w-4 text-green-500" />Copied!</>
              : <><Copy className="mr-2 h-4 w-4" />Copy license key</>}
          </Button>

          <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground leading-relaxed space-y-1">
            <p className="font-medium text-foreground">To activate:</p>
            <p>1. Open AegisAPI on your computer</p>
            <p>2. Go to the <strong>License</strong> tab (key icon in sidebar)</p>
            <p>3. Paste the key above into the <strong>License key</strong> field and click <strong>Activate</strong></p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            This key is also saved to your account — you can retrieve it from the My Licenses tab at any time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Purchases tab ─────────────────────────────────────────────────────────────

function PurchasesTab() {
  const { getToken } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemingPurchase, setRedeemingPurchase] = useState<Purchase | null>(null);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const { toast } = useToast();

  async function load() {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/licensing/account/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPurchases(data.purchases ?? []);
    } catch {
      setError("Failed to load purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleRedeemed(licenseKey: string) {
    setRedeemingPurchase(null);
    setIssuedKey(licenseKey);
    load();
    toast({ title: "License key issued", description: "Copy it and paste it into the app." });
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading purchases…</div>;
  if (error) return <div className="flex items-center justify-center py-16 text-destructive text-sm">{error}</div>;

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-foreground">No purchases yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your purchase history will appear here after your first payment.
          </p>
        </div>
        <Button asChild size="sm" className="mt-2">
          <a href={`${BASE}/pricing`}>View pricing</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {purchases.map((p) => (
          <Card key={p.id} className="border-border/60 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{tierLabel(p.tier, p.callBalance)}</CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs ${p.redeemed ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-amber-500/15 text-amber-400 border-amber-500/20"}`}
                >
                  {p.redeemed ? "Key issued" : "Pending activation"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Purchased {new Date(p.purchasedAt).toLocaleDateString()} · ${p.priceDollars} · Valid until {new Date(p.licenseExpiresAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!p.redeemed ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    To activate, you need to generate a license key bound to your computer.
                  </p>
                  <Button size="sm" onClick={() => setRedeemingPurchase(p)}>
                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                    Get license key
                  </Button>
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      You'll need your <strong className="text-amber-300">Machine ID</strong> from the AegisAPI desktop app. Open the app → License tab → copy the Machine ID shown there.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Key issued on {p.redeemedAt ? new Date(p.redeemedAt).toLocaleDateString() : "—"}.
                  The license key is saved in your <strong>My Licenses</strong> tab above.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {redeemingPurchase && (
        <RedeemDialog
          purchase={redeemingPurchase}
          open={!!redeemingPurchase}
          onClose={() => setRedeemingPurchase(null)}
          onRedeemed={handleRedeemed}
        />
      )}

      {issuedKey && (
        <IssuedKeyDialog
          licenseKey={issuedKey}
          open={!!issuedKey}
          onClose={() => setIssuedKey(null)}
        />
      )}
    </>
  );
}

function PaymentSuccessBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4">
      <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
      <div>
        <p className="font-semibold text-green-300">Payment successful!</p>
        <p className="mt-0.5 text-sm text-green-300/70">
          Your purchase is confirmed. Go to the <strong>Purchases</strong> tab and click <strong>"Get license key"</strong> to generate your key — you'll need your Machine ID from the AegisAPI desktop app.
        </p>
      </div>
    </div>
  );
}

function PaymentFailedBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <div>
        <p className="font-semibold text-red-300">Payment not completed</p>
        <p className="mt-0.5 text-sm text-red-300/70">
          Your card was charged but 3D Secure authentication did not complete — the charge has been automatically refunded. No license was issued. Please try again with a card that supports full 3DS authentication.
        </p>
      </div>
    </div>
  );
}

type CheckoutOutcome = "granted" | "refunded" | "pending" | "checking" | null;

export default function AccountPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [, navigate] = useLocation();

  // Capture checkout params from the URL exactly once at mount.
  // We read window.location.search directly (not wouter's reactive useSearch)
  // so replaceState later doesn't race against the effect.
  const [initialCheckout] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      isReturn: p.get("checkout") === "return",
      sessionId: p.get("session_id"),
    };
  });

  const [checkoutOutcome, setCheckoutOutcome] = useState<CheckoutOutcome>(
    initialCheckout.isReturn ? "checking" : null
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/sign-in");
  }, [isLoaded, isSignedIn, navigate]);

  // Check real payment outcome when returning from Stripe. Poll while
  // the webhook may still be writing the purchase token.
  useEffect(() => {
    if (!initialCheckout.isReturn || !isLoaded || !isSignedIn) return;

    window.history.replaceState(null, "", window.location.pathname);

    if (!initialCheckout.sessionId) {
      setCheckoutOutcome(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    async function check() {
      try {
        const token = await getToken();
        const res = await fetch(
          `${BASE}/licensing/stripe/session-status?session_id=${encodeURIComponent(initialCheckout.sessionId!)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (cancelled) return;
        const status = data.status as CheckoutOutcome;
        if (status === "granted" || status === "refunded") {
          setCheckoutOutcome(status);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          setCheckoutOutcome("pending");
          return;
        }
        setTimeout(check, 2000);
      } catch {
        if (!cancelled) setCheckoutOutcome(null);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [initialCheckout.isReturn, initialCheckout.sessionId, isLoaded, isSignedIn, getToken]);

  if (!isLoaded || !isSignedIn) return null;

  const paymentGranted = checkoutOutcome === "granted";
  const paymentRefunded = checkoutOutcome === "refunded";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">My account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Purchases and issued license keys.
        </p>
      </div>

      {checkoutOutcome === "checking" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-5 py-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying payment…</p>
        </div>
      )}
      {checkoutOutcome === "pending" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Payment is still processing. Refresh this page in a minute.
          </p>
        </div>
      )}
      {paymentGranted && <PaymentSuccessBanner />}
      {paymentRefunded && <PaymentFailedBanner />}

      <Tabs defaultValue={paymentGranted ? "purchases" : "licenses"}>
        <TabsList className="mb-6">
          <TabsTrigger value="licenses">My licenses</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses">
          <LicensesTab />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

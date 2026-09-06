import { Link } from "wouter";
import { Lock, ShieldCheck, WifiOff, KeyRound, ArrowRight, Terminal, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import aegisIconTrimmed from "@/assets/aegis-icon-trimmed.png";
import prisonBars from "@/assets/prison-bars-tile.png";

const FEATURES = [
  {
    icon: Lock,
    title: "AES-256-GCM at rest",
    body: "Every secret is encrypted before it ever touches disk, using an authenticated cipher that detects tampering, not just conceals contents.",
  },
  {
    icon: WifiOff,
    title: "Zero telemetry",
    body: "The installed app does not phone home. No analytics, crash reporting, or license check-in to our servers. License keys are verified on the PC. Keys leave this machine only when you Send to an API you configured.",
  },
  {
    icon: KeyRound,
    title: "The vault stays on this PC",
    body: "Vaults are stored and decrypted locally. There is no cloud sync and no server-side copy. We never hold your secrets.",
  },
  {
    icon: ScrollText,
    title: "Complete call history, always reviewable",
    body: "Every API call made through AegisAPI is logged in full. Nothing is left out, and you can review the complete history at any time.",
  },
  {
    icon: ShieldCheck,
    title: "Built for engineers who ship",
    body: "A fast, keyboard-friendly vault for the API keys, tokens, and secrets you juggle every day across projects and environments.",
  },
];

const STEPS = [
  { n: "01", title: "Install", body: "Download the Windows installer and run Setup. No account required to start a vault." },
  { n: "02", title: "Create your vault", body: "Set a passphrase. AegisAPI derives your encryption key locally with Argon2 — we never see it." },
  { n: "03", title: "Store & retrieve", body: "Save keys once, pull them into any project instantly, without ever pasting secrets into plaintext files again." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.6) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black 20%, transparent 80%)",
            }}
          />
          <div className="absolute left-1/2 top-[-14rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute right-[-8rem] top-32 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[100px]" />
          <div className="absolute left-[-8rem] top-56 h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative h-28 w-full overflow-hidden sm:h-36" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${prisonBars})`,
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%",
              backgroundPosition: "center",
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-5xl">
              AegisAPI
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/10 to-background" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-8 pt-6 sm:pt-8">
          <div className="relative flex items-center justify-center">
            <img
              src={aegisIconTrimmed}
              alt=""
              className="pointer-events-none absolute left-0 top-1/2 hidden h-36 w-36 -translate-y-1/2 object-contain drop-shadow-[0_0_35px_hsl(var(--primary)/0.5)] md:block lg:h-44 lg:w-44"
            />
            <img
              src={aegisIconTrimmed}
              alt=""
              className="pointer-events-none absolute right-0 top-1/2 hidden h-36 w-36 -translate-y-1/2 object-contain drop-shadow-[0_0_35px_hsl(var(--primary)/0.5)] md:block lg:h-44 lg:w-44"
            />

            <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary/90">
                Enterprise-grade encryption
              </span>

              <h1 className="text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-5xl">
                Your API keys, locked down
                <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text font-semibold text-transparent">
                  on this PC.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A local encrypted vault. We never hold a copy. While the app is
                unlocked, it can see your keys — that is how Send works.
              </p>

              <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group shadow-[0_0_30px_-6px_hsl(var(--primary)/0.7)]"
                >
                  <Link href="/download">
                    Start your free trial
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>

              <p className="mt-5 text-xs tracking-wide text-muted-foreground">
                No credit card required · Windows desktop app
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/60 bg-card/30 pb-14 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Encryption isn't a feature.
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                It's the foundation.
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every decision behind AegisAPI comes back to one rule: your
              secrets stay in a local vault. We do not hold a copy. The
              unlocked app can read them so you can Send to APIs you configure.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 text-primary ring-1 ring-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                No cloud onboarding flow. Install, unlock, and start storing
                secrets in minutes.
              </p>

              <div className="mt-10 space-y-8">
                {STEPS.map((step) => (
                  <div key={step.n} className="flex gap-5">
                    <span className="bg-gradient-to-b from-primary to-accent bg-clip-text text-2xl font-extrabold text-transparent">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className="mt-10 shadow-[0_0_30px_-6px_hsl(var(--primary)/0.7)]"
              >
                <Link href="/download">
                  Download AegisAPI
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative rounded-2xl border border-primary/30 bg-card p-2 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)]">
              <div className="rounded-xl bg-background/80 p-6 font-mono text-sm">
                <div className="flex items-center gap-2 border-b border-border/60 pb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-chart-4/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                  <Terminal className="ml-2 h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">AegisAPI Vault</span>
                </div>
                <div className="mt-4 space-y-2 text-xs leading-relaxed">
                  <p className="text-muted-foreground">$ vault unlock</p>
                  <p className="text-foreground">Passphrase: ••••••••••••</p>
                  <p className="text-accent">✓ Vault unlocked (AES-256-GCM)</p>
                  <p className="text-muted-foreground mt-4">$ vault get STRIPE_SECRET_KEY</p>
                  <p className="text-foreground">sk_live_••••••••••••••••••••</p>
                  <p className="text-muted-foreground mt-4">$ send POST https://api.example.com</p>
                  <p className="text-accent">✓ Only the URL you configured</p>
                  <p className="mt-2 inline-block h-3.5 w-1.5 animate-pulse bg-primary/70 align-middle" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Stop pasting secrets into plaintext files.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Try AegisAPI free. Upgrade only when you're ready.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/download">Start your free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/security">See how it's secured</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

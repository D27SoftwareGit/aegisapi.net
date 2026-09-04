import { Download as DownloadIcon, Monitor, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const REQUIREMENTS = {
  windows: ["Windows 10 or later (64-bit)", "150 MB free disk space"],
  mac: ["macOS 12 (Monterey) or later", "150 MB free disk space"],
  linux: [
    "Modern 64-bit Linux distribution (.deb)",
    "libsecret / a running keyring service (GNOME Keyring, KWallet) — required, not optional",
    "150 MB free disk space",
  ],
};

const COMMON_REQUIREMENT = "No account or internet connection required to use your vault";

export default function Download() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <DownloadIcon className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Get AegisAPI
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Start your free trial — 20 API calls or 7 days, whichever comes
          first. Full features, no credit card, no telemetry.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="w-full sm:w-auto" data-testid="button-download-windows">
            <Monitor className="mr-2 h-4 w-4" />
            Download for Windows
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-download-mac">
            <Monitor className="mr-2 h-4 w-4" />
            Download for macOS
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-download-linux">
            <Monitor className="mr-2 h-4 w-4" />
            Download for Linux
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          AegisAPI-Setup-latest.exe (Windows) · AegisAPI-latest.dmg (macOS) ·
          AegisAPI-latest.deb (Linux)
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Windows</h3>
          <ul className="mt-3 space-y-2">
            {REQUIREMENTS.windows.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">
                {r}
              </li>
            ))}
            <li className="text-sm text-muted-foreground">{COMMON_REQUIREMENT}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">macOS</h3>
          <ul className="mt-3 space-y-2">
            {REQUIREMENTS.mac.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">
                {r}
              </li>
            ))}
            <li className="text-sm text-muted-foreground">{COMMON_REQUIREMENT}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Linux</h3>
          <ul className="mt-3 space-y-2">
            {REQUIREMENTS.linux.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">
                {r}
              </li>
            ))}
            <li className="text-sm text-muted-foreground">{COMMON_REQUIREMENT}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">First launch</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            On first run, you'll set a vault passphrase. This passphrase is
            never sent anywhere. If you lose it, nobody, including us, can
            recover your vault. That's the point.
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Every download is signed and verifiable. See the security page for details.
      </div>
    </div>
  );
}

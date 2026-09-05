import { Download as DownloadIcon, Monitor, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import manifest from "@/data/download-manifest.json";

const setupHref = manifest.path;

const WINDOWS_REQUIREMENTS = [
  "Windows 10 or later (64-bit)",
  "150 MB free disk space",
  "No account required to start a vault. The installed app does not phone home.",
];

export default function Download() {
  const hashReady = manifest.sha256.length > 0;

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
          first. Full features, no credit card. Windows only.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-download-windows">
            <a href={setupHref}>
              <Monitor className="mr-2 h-4 w-4" />
              Download for Windows
            </a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {manifest.filename}
          {manifest.build ? ` · ${manifest.build}` : ""}
        </p>
        {hashReady ? (
          <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
            SHA-256 {manifest.sha256}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            SHA-256 will be published here with the signed Setup.
          </p>
        )}
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Windows</h3>
          <ul className="mt-3 space-y-2">
            {WINDOWS_REQUIREMENTS.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">
                {r}
              </li>
            ))}
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
        The Windows Setup is Authenticode-signed. Compare the SHA-256 on this page to the file you downloaded.
      </div>
    </div>
  );
}

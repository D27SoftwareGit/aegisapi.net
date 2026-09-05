import { Lock, WifiOff, Fingerprint, ShieldAlert, FileKey, ScrollText } from "lucide-react";
import { motion } from "framer-motion";

const PILLARS = [
  {
    icon: Lock,
    title: "AES-256-GCM encryption at rest",
    body: "Every vault entry is encrypted with AES-256 in Galois/Counter Mode, an authenticated encryption scheme. It doesn't just hide your data, it detects if a single byte was tampered with.",
  },
  {
    icon: Fingerprint,
    title: "Argon2 key derivation",
    body: "Your passphrase is never stored. It is run through Argon2, the winner of the Password Hashing Competition, to derive the key that unlocks your vault. Slow by design, so brute-forcing is impractical.",
  },
  {
    icon: WifiOff,
    title: "No telemetry, no analytics, no phone-home",
    body: "The installed app does not phone home. No analytics, crash reporting, or license check-in to our servers. License keys are verified on the PC. Send goes only to URLs you configure.",
  },
  {
    icon: FileKey,
    title: "Local-only storage",
    body: "Your encrypted vault file lives on your disk. There is no cloud sync and no server-side copy of your secrets. If our servers went dark tomorrow, your vault would still open.",
  },
  {
    icon: ShieldAlert,
    title: "Tamper-evident by design",
    body: "Authenticated encryption means any attempt to modify the vault file outside of AegisAPI is detected on next unlock, rather than silently accepted.",
  },
  {
    icon: ScrollText,
    title: "Complete, reviewable call log",
    body: "Every API call made through AegisAPI is logged. Nothing is left out, and the full history is always available for you to review.",
  },
];

export default function Security() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Security is the product, not a footnote.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          AegisAPI was built on the assumption that the vault holding your
          secrets should be at least as hard to compromise as the secrets
          themselves.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-xl border border-border/60 bg-card p-6"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <p.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 rounded-2xl border border-border/60 bg-card/60 p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              The no-telemetry proof
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The installed app does not phone home — not for licensing, not for
              updates, not for analytics. The only network activity is Send to
              APIs you configured. This website is a separate browser product
              (account, pay, issue keys).
            </p>
          </div>
          <div className="w-full max-w-md rounded-xl border border-border/60 bg-background/60 p-6 font-mono text-xs">
            <p className="text-muted-foreground">Outbound calls AegisAPI ever makes:</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span className="text-foreground">Only the API calls you configure yourself — every one logged, in full, and reviewable anytime</span>
              </li>
              <li className="flex items-start gap-2 opacity-50">
                <span>✕</span>
                <span>License checks, activation, or "phone-home" of any kind</span>
              </li>
              <li className="flex items-start gap-2 opacity-50">
                <span>✕</span>
                <span>Analytics, crash reporting, or usage tracking</span>
              </li>
              <li className="flex items-start gap-2 opacity-50">
                <span>✕</span>
                <span>Vault contents transmitted anywhere</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          Have a security question or want to report a vulnerability?{" "}
          <a href="mailto:security@aegisapi.net" className="text-primary hover:underline">
            security@aegisapi.net
          </a>
        </p>
      </div>
    </div>
  );
}

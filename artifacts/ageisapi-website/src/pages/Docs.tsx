import { BookOpen, Terminal, ArrowLeftRight, LifeBuoy } from "lucide-react";

const SECTIONS = [
  {
    icon: Terminal,
    title: "Getting started",
    body: "After installing AegisAPI, launch the app and set a vault passphrase. Your vault file is created locally and encrypted immediately — there is no setup wizard that requires network access.",
  },
  {
    icon: BookOpen,
    title: "Storing and retrieving secrets",
    body: "Add a secret from the vault view by naming it and pasting the value. Retrieve it any time by searching the vault, or copy it directly to your clipboard for use in another application.",
  },
  {
    icon: ArrowLeftRight,
    title: "Licenses are bound to one machine",
    body: "One physical PC, one license. Extra Windows logins on that PC are not extra seats. The key cannot move to another machine. Remote desktop is not a v1 SKU. After you paste a key, the app verifies it locally — it does not call our license servers.",
  },
  {
    icon: LifeBuoy,
    title: "Getting support",
    body: "For account, billing, or licensing questions, contact support@aegisapi.net. For vulnerability reports, use security@aegisapi.net so it reaches the right team directly.",
  },
];

export default function Docs() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Documentation
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Everything you need to install, use, and manage your AegisAPI vault.
        </p>
      </div>

      <div className="mt-16 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { LifeBuoy, Shield, Scale, Briefcase } from "lucide-react";

const CONTACTS = [
  {
    icon: LifeBuoy,
    title: "Account, billing, and licenses",
    body: "Questions about checkout, redeeming a key on this site, or a purchase you already made.",
    href: "mailto:support@aegisapi.net",
    label: "support@aegisapi.net",
  },
  {
    icon: Shield,
    title: "Security",
    body: "Vulnerability reports and security questions about the Windows app or this site.",
    href: "mailto:security@aegisapi.net",
    label: "security@aegisapi.net",
  },
  {
    icon: Scale,
    title: "Legal",
    body: "Terms, privacy, and license-agreement questions. The full text is on the Legal page.",
    href: "mailto:legal@aegisapi.net",
    label: "legal@aegisapi.net",
  },
  {
    icon: Briefcase,
    title: "Enterprise and sales",
    body: "Volume licensing and procurement. Enterprise is not a self-serve multi-machine SKU on this site.",
    href: "mailto:sales@aegisapi.net",
    label: "sales@aegisapi.net",
  },
];

export default function Support() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Support
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Email is the right channel. We do not run in-app chat, and the
          Windows app does not phone home for support.
        </p>
      </div>

      <div className="mt-16 space-y-6">
        {CONTACTS.map((c) => (
          <div key={c.title} className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <a href={c.href} className="mt-3 inline-block text-sm text-primary hover:underline">
                  {c.label}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        A license is bound to one physical PC and cannot move. Extra Windows
        logins on that PC are not extra seats.
      </p>
    </div>
  );
}

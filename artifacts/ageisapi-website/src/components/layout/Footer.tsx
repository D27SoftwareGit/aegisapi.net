import { Link } from "wouter";
import d27Logo from "@assets/UK-red01-Phillip_Cox_-_D27_Software_L.L.C.R1-FF-_Tm_Symbol_01-_1783697626987.png";
import { Logo } from "./Logo";

const PRODUCT_LINKS = [
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
];

const RESOURCE_LINKS = [
  { href: "/docs", label: "Documentation" },
  { href: "/support", label: "Support" },
  { href: "/security", label: "No-telemetry proof" },
];

const LEGAL_LINKS = [
  { href: "/legal", label: "Terms of service" },
  { href: "/legal", label: "Privacy policy" },
  { href: "/legal", label: "License agreement" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A local, encrypted vault for API keys and secrets. Nothing leaves
              your machine unless you tell it to.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AegisAPI. All rights reserved.
          </p>
          <a
            href="https://d27software.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-muted-foreground transition-opacity hover:opacity-80"
            data-testid="link-powered-by-d27"
          >
            <span>Powered by</span>
            <img src={d27Logo} alt="D27 Software L.L.C." className="h-9 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}

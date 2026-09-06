import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User } from "lucide-react";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoaded && isSignedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  {user?.firstName ?? "Account"}
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/download">Start free trial</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 px-6 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {isLoaded && isSignedIn ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/account" onClick={() => setOpen(false)}>
                      <User className="mr-1.5 h-3.5 w-3.5" />
                      My account
                    </Link>
                  </Button>
                  <div className="flex justify-start px-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/download" onClick={() => setOpen(false)}>
                      Start free trial
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

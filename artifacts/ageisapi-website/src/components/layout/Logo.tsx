import aegisIcon from "@assets/AegisIcon_1783697471275.png";
import { Link } from "wouter";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 shrink-0 ${className}`}
      data-testid="link-logo"
    >
      <img src={aegisIcon} alt="AegisAPI" className="h-8 w-8 object-contain" />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        AegisAPI
      </span>
    </Link>
  );
}

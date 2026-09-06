import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        That URL is not a page on this site.
      </p>
      <Link href="/" className="mt-8 text-sm text-primary hover:underline">
        Back to AegisAPI
      </Link>
    </div>
  );
}

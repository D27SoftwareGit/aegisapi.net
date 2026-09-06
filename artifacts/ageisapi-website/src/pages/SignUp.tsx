import { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Step = "start" | "verify";

export default function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("start");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/account");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError?.errors?.[0]?.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card/50 p-8 shadow-lg backdrop-blur-sm">

        {step === "start" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign up to get started with AegisAPI</p>
            </div>

            <form onSubmit={handleStart} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">First name</label>
                  <input
                    className={inputClass}
                    placeholder="First"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Last name <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Last"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email address</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className={`${inputClass} pr-10`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Confirm password</label>
                <input
                  type="password"
                  required
                  className={`${inputClass} ${
                    confirmPassword && confirmPassword !== password
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }`}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <a href="/sign-in" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a verification code to <span className="text-foreground">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  className={inputClass}
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify email
              </button>

              <button
                type="button"
                onClick={async () => {
                  setError("");
                  try {
                    await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
                  } catch {
                    setError("Could not resend code. Please try again.");
                  }
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Resend code
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { authErrorMessage, loginEmail, loginGoogle, signUpEmail } from "../lib/auth";
import { haptic, cn } from "../lib/ui";

const field =
  "w-full rounded-2xl border hairline surface py-3.5 pl-11 pr-4 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const label = "mb-1.5 block text-sm font-medium text-ink-mute";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy("email");
    haptic(10);
    try {
      if (isSignup) await signUpEmail(name, email, password);
      else await loginEmail(email, password);
      // onAuthStateChanged in App takes over from here.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  };

  const google = async () => {
    if (busy) return;
    setError("");
    setBusy("google");
    haptic(10);
    try {
      await loginGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  };

  const swap = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg px-5 pb-8 pt-safe">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
      >
        {/* Brand */}
        <div className="mb-8 text-center">
          <motion.img
            src="/logo.png"
            alt="MonkMode"
            className="mx-auto h-20 w-20 object-contain drop-shadow-[0_8px_24px_rgba(237,125,28,0.45)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 16 }}
          />
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight">
            Monk<span className="text-gradient">Mode</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-mute">
            {isSignup
              ? "Create an account to sync across all your devices."
              : "Welcome back — log in to pick up where you left off."}
          </p>
        </div>

        {/* Segmented toggle */}
        <div className="glass-soft mb-5 flex gap-1 rounded-2xl p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={cn(
                "relative flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                mode === m ? "text-white" : "text-ink-mute hover:text-ink",
              )}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-pill"
                  className="absolute inset-0 -z-10 rounded-xl grad-primary shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <div>
              <label className={label} htmlFor="au-name">
                Name
              </label>
              <div className="relative">
                <UserIcon
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="au-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className={field}
                />
              </div>
            </div>
          )}

          <div>
            <label className={label} htmlFor="au-email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="au-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="au-pw">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="au-pw"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 6 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className={cn(field, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xl text-ink-faint transition-colors hover:text-ink"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-xl bg-danger/12 px-3.5 py-2.5 text-sm font-medium text-danger"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={busy !== null}
            className="btn-primary flex h-[52px] w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60"
          >
            {busy === "email" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isSignup ? "Create account" : "Log in"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
          <span className="h-px flex-1 bg-line/15" />
          or
          <span className="h-px flex-1 bg-line/15" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={google}
          disabled={busy !== null}
          className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border hairline surface py-3.5 text-base font-semibold text-ink transition-colors surface-hover disabled:opacity-60"
        >
          {busy === "google" ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-6 text-center text-sm text-ink-mute">
          {isSignup ? "Already have an account?" : "New to MonkMode?"}{" "}
          <button
            type="button"
            onClick={swap}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            {isSignup ? "Log in" : "Create one"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

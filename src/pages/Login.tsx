import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { authErrorMessage, loginEmail, loginGoogle, signUpEmail } from "../lib/auth";
import { auth } from "../lib/firebase";
import { haptic } from "../lib/ui";

const field =
  "w-full rounded-xl border hairline surface py-3 pl-11 pr-11 text-base text-ink placeholder:text-ink-faint outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const labelCls = "mb-1 block text-sm font-medium text-ink-mute";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setInfo("");
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
    setInfo("");
    setBusy("google");
    haptic(10);
    try {
      await loginGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("");
      setInfo("Password reset link sent — check your inbox.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const swap = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
    setInfo("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-bg px-7 py-6">
      {/* Ambient gradient orbs for depth */}
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-primary/25 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[-12%] left-[-12%] h-72 w-72 rounded-full bg-primary-soft/20 blur-[90px]" />
      {/* Decorative mountain + sun motif */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="312" cy="46" r="32" className="fill-[rgb(var(--warning)/0.12)]" />
        <path d="M0 200 L70 110 L120 150 L190 80 L250 140 L320 90 L400 130 L400 200 Z" className="fill-[rgb(var(--primary)/0.06)]" />
        <path d="M120 200 L210 100 L270 150 L330 110 L400 150 L400 200 Z" className="fill-[rgb(var(--primary)/0.10)]" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Brand — icon with glowing halo + wordmark, centered */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 220, damping: 16 }}
            className="relative grid h-16 w-16 place-items-center"
          >
            <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <span className="grid h-16 w-16 place-items-center rounded-2xl border hairline bg-card/60 backdrop-blur-md ring-1 ring-primary/20">
              <img src="/logo.png" alt="MonkMode" className="h-12 w-12 object-contain drop-shadow-[0_6px_16px_rgba(225,29,42,0.4)]" />
            </span>
          </motion.div>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            Monk<span className="text-gradient">Mode</span>
          </span>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl p-[1px]">
          {/* gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/40 via-white/10 to-transparent opacity-70" />
          <div className="glass relative rounded-[15px] p-5 shadow-glow-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {isSignup && (
              <div>
                <label htmlFor="au-name" className={labelCls}>
                  Name
                </label>
                <div className="relative">
                  <UserIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
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
              <label htmlFor="au-email" className={labelCls}>
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
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
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="au-pw" className="text-sm font-medium text-ink-mute">
                  Password
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={forgot}
                    className="cursor-pointer text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  id="au-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "At least 6 characters" : "••••••"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  className={field}
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

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="rounded-xl bg-danger/12 px-3.5 py-2.5 text-sm font-medium text-danger"
                >
                  {error}
                </motion.p>
              )}
              {info && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-success/12 px-3.5 py-2.5 text-sm font-medium text-success"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={busy !== null}
              className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base disabled:opacity-70"
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
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[rgb(var(--line)/0.12)]" />
            <span className="text-xs font-medium text-ink-faint">or continue with</span>
            <span className="h-px flex-1 bg-[rgb(var(--line)/0.12)]" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={busy !== null}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border hairline surface font-semibold text-ink transition active:scale-[0.98] surface-hover disabled:opacity-70"
          >
            {busy === "google" ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon />}
            Google
          </button>
          </div>
        </div>

        {/* Switch login / signup */}
        <p className="mt-5 text-center text-sm text-ink-mute">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={swap} className="cursor-pointer font-bold text-primary hover:underline">
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { authErrorMessage, loginEmail, loginGoogle, signUpEmail } from "../lib/auth";
import { auth } from "../lib/firebase";
import { haptic, cn } from "../lib/ui";

const field =
  "w-full rounded-2xl border hairline surface py-3.5 pl-11 pr-11 text-base text-ink placeholder:text-ink-faint outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

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
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-bg px-5 py-8">
      {/* faint mountain + sun motif */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="310" cy="48" r="30" className="fill-[rgb(var(--warning)/0.14)]" />
        <path d="M0 200 L70 110 L120 150 L190 80 L250 140 L320 90 L400 130 L400 200 Z" className="fill-[rgb(var(--primary)/0.08)]" />
        <path d="M120 200 L210 100 L270 150 L330 110 L400 150 L400 200 Z" className="fill-[rgb(var(--primary)/0.12)]" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Brand */}
        <div className="mb-5 flex flex-col items-center">
          <div className="h-[58px] w-24 overflow-hidden">
            <img src="/logo.png" alt="MonkMode" className="w-24 object-top" />
          </div>
          <span className="font-heading text-lg font-extrabold tracking-tight">
            Monk<span className="text-primary">Mode</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-6">
          <h1 className="text-center font-heading text-2xl font-extrabold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-center text-sm text-ink-mute">
            {isSignup
              ? "Start building your best self today."
              : "Let's pick up where you left off."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {isSignup && (
              <div className="relative">
                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className={field}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className={field}
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={field}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ink-faint hover:text-ink-mute"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isSignup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={forgot}
                  className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="text-center text-sm text-danger">{error}</p>}
            {info && <p className="text-center text-sm text-success">{info}</p>}

            <button type="submit" disabled={busy !== null} className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-70">
              {busy === "email" ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSignup ? "Sign up" : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[rgb(var(--line)/0.12)]" />
            <span className="text-xs font-medium text-ink-faint">Or continue with</span>
            <span className="h-px flex-1 bg-[rgb(var(--line)/0.12)]" />
          </div>

          <button
            onClick={google}
            disabled={busy !== null}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border hairline surface py-3.5 font-semibold text-ink transition active:scale-[0.98] disabled:opacity-70"
          >
            {busy === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>
        </div>

        {/* Toggle */}
        <p className="mt-5 text-center text-sm text-ink-mute">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={swap} className={cn("cursor-pointer font-bold text-primary hover:underline")}>
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

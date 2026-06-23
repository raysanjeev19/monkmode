import { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useStore } from "./store/useStore";
import { todayISO } from "./lib/date";
import { useReminders } from "./lib/useReminders";
import { useFocusTicker } from "./lib/useFocusTicker";
import { useAuth } from "./lib/auth";
import { isFirebaseConfigured } from "./lib/firebase";
import { startCloudSync, stopCloudSync } from "./lib/sync";
import BottomNav from "./components/BottomNav";
import DraggableFab from "./components/DraggableFab";
import Onboarding from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import BootSplash from "./components/BootSplash";
import Login from "./pages/Login";
import Home from "./pages/Home";

/** How long the branded launch screen stays up on open (ms). */
const SPLASH_MS = 1200;

// Code-split the heavier tabs (Progress pulls in Recharts).
const Planner = lazy(() => import("./pages/Planner"));
const Goals = lazy(() => import("./pages/Goals"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));
const Focus = lazy(() => import("./pages/Focus"));

function PageFallback() {
  return (
    <div className="flex justify-center pt-20 text-ink-faint">
      <span className="h-7 w-7 animate-spin rounded-full border-2 hairline border-t-primary" />
    </div>
  );
}

/** Full-screen brand splash shown while auth / first sync resolves. */
function Splash() {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-bg">
      <motion.img
        src="/logo.png"
        alt="MonkMode"
        className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(225,29,42,0.4)]"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1, 0.9], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
        className="mx-auto w-full max-w-md px-3 pb-36 pt-safe"
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/focus" element={<Focus />} />
            {/* Unknown routes fall back to Home instead of a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

/**
 * Hardware back-button handling for the installed app (Android PWA / APK).
 * Mimics Swiggy/Zomato: a back press navigates to Home in-app, and a second
 * back press at Home exits the app — never a blank/white screen. Disabled in a
 * normal browser tab so the browser's own back behaviour is left untouched.
 */
function BackGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) return;

    // Seed a guard entry so the first back press is caught in-app.
    window.history.pushState(null, "", window.location.href);

    const onPop = () => {
      if (window.location.pathname !== "/") {
        // Deep page → jump Home in-app (replace, so history doesn't grow), and
        // re-arm the guard so the next back is caught here too.
        navigate("/", { replace: true });
        window.history.pushState(null, "", window.location.href);
        return;
      }
      // Already Home → stop guarding and let this back propagate so the app
      // actually closes (instead of a confirm/blank page).
      window.removeEventListener("popstate", onPop);
      window.history.back();
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);

  return null;
}

function MainApp() {
  const onboarded = useStore((s) => s.profile.onboarded);
  const ensureRecurring = useStore((s) => s.ensureRecurring);
  const pruneGenerated = useStore((s) => s.pruneGenerated);

  // Materialise recurring tasks for today on launch, and reclaim stale
  // auto-generated occurrences so stored state can't grow without bound.
  useEffect(() => {
    pruneGenerated();
    ensureRecurring(todayISO());
  }, [ensureRecurring, pruneGenerated]);

  useReminders();
  useFocusTicker();

  if (!onboarded) return <Onboarding />;

  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <OfflineBanner />
        <BackGuard />
        <AnimatedRoutes />
        <DraggableFab />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  const theme = useStore((s) => s.profile.theme);
  const { user, loading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [booting, setBooting] = useState(true);

  // Keep <html> theme class in sync app-wide (Profile also sets it)
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    // Match the browser/PWA status bar to the current theme so it never shows
    // a stray cream/white strip in dark mode.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#151210" : "#FBF4E9");
  }, [theme]);

  // Hold the branded launch screen for a fixed minimum on every open.
  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Start/stop cloud sync as the signed-in user changes.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (user) {
      setSyncing(true);
      startCloudSync().finally(() => setSyncing(false));
      return () => stopCloudSync();
    }
    stopCloudSync();
  }, [user]);

  const content = (() => {
    // ── Local-only mode (Firebase not configured yet) ──
    if (!isFirebaseConfigured)
      return (
        <ErrorBoundary>
          <MainApp />
        </ErrorBoundary>
      );
    // ── Authenticated mode ──
    if (loading) return <Splash />;
    if (!user) return <Login />;
    if (syncing) return <Splash />;
    return (
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    );
  })();

  return (
    <>
      {content}
      <AnimatePresence>{booting && <BootSplash key="boot" />}</AnimatePresence>
    </>
  );
}

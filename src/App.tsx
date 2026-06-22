import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "./store/useStore";
import { todayISO } from "./lib/date";
import { useReminders } from "./lib/useReminders";
import { useAuth } from "./lib/auth";
import { isFirebaseConfigured } from "./lib/firebase";
import { startCloudSync, stopCloudSync } from "./lib/sync";
import BottomNav from "./components/BottomNav";
import DraggableFab from "./components/DraggableFab";
import Onboarding from "./components/Onboarding";
import Login from "./pages/Login";
import Home from "./pages/Home";

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
        className="h-20 w-20 object-contain drop-shadow-[0_8px_24px_rgba(237,125,28,0.45)]"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1, 0.9], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
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
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

function MainApp() {
  const onboarded = useStore((s) => s.profile.onboarded);
  const ensureRecurring = useStore((s) => s.ensureRecurring);

  // Materialise recurring tasks for today on launch
  useEffect(() => {
    ensureRecurring(todayISO());
  }, [ensureRecurring]);

  useReminders();

  if (!onboarded) return <Onboarding />;

  return (
    <BrowserRouter>
      <div className="relative min-h-screen pt-2">
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

  // Keep <html> theme class in sync app-wide (Profile also sets it)
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

  // ── Local-only mode (Firebase not configured yet) ──
  if (!isFirebaseConfigured) return <MainApp />;

  // ── Authenticated mode ──
  if (loading) return <Splash />;
  if (!user) return <Login />;
  if (syncing) return <Splash />;
  return <MainApp />;
}

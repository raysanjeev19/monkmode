import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "./store/useStore";
import BottomNav from "./components/BottomNav";
import DraggableFab from "./components/DraggableFab";
import Home from "./pages/Home";

// Code-split the heavier tabs (Progress pulls in Recharts).
const Planner = lazy(() => import("./pages/Planner"));
const Goals = lazy(() => import("./pages/Goals"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));

function PageFallback() {
  return (
    <div className="flex justify-center pt-20 text-ink-faint">
      <span className="h-7 w-7 animate-spin rounded-full border-2 hairline border-t-primary" />
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
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useStore((s) => s.profile.theme);

  // Keep <html> theme class in sync app-wide (Profile also sets it)
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

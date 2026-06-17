import { NavLink } from "react-router-dom";
import { Home, CalendarDays, Target, BarChart3, User } from "lucide-react";
import { cn, haptic } from "../lib/ui";

const LEFT = [
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];
const RIGHT = [
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/profile", label: "Profile", icon: User },
];

function Tab({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end?: boolean }) {
  return (
    <NavLink to={to} end={end} onClick={() => haptic()} className="flex flex-1 flex-col items-center">
      {({ isActive }) => (
        <span
          className={cn(
            "flex min-h-[46px] w-full flex-col items-center justify-center gap-1 py-1.5 transition-colors",
            isActive ? "text-primary" : "text-ink-faint hover:text-ink-mute",
          )}
        >
          <Icon
            size={23}
            className={cn("transition-transform", isActive && "scale-110 drop-shadow-[0_0_10px_rgba(237,125,28,0.6)]")}
          />
          <span className={cn("text-[10px] leading-none", isActive ? "font-bold" : "font-medium")}>{label}</span>
        </span>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="glass flex items-end justify-around rounded-b-none rounded-t-[28px] border-x-0 border-b-0 px-2 pt-2 pb-safe">
        {LEFT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}

        {/* Elevated center Home button */}
        <NavLink to="/" end onClick={() => haptic(12)} aria-label="Home" className="flex flex-1 flex-col items-center">
          {({ isActive }) => (
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  "-mt-9 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary-soft to-primary-dim text-white shadow-glow ring-4 ring-bg transition-transform active:scale-95",
                  isActive && "scale-105",
                )}
              >
                <Home size={27} />
              </span>
              <span className={cn("mt-1 text-[10px] leading-none", isActive ? "font-bold text-primary" : "font-medium text-ink-faint")}>
                Home
              </span>
            </span>
          )}
        </NavLink>

        {RIGHT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

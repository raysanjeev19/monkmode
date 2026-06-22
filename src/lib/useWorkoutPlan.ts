import { useAuth } from "./auth";
import { auth } from "./firebase";
import { RECOMP_PLAN } from "../data/recompPlan";
import { hasBakedPlan, type WorkoutPlan } from "./workoutPlan";

/**
 * The active workout plan for the signed-in user. The two coach accounts get
 * the baked-in 5-month Recomp plan; everyone else gets none yet (they'll be
 * able to create/upload their own — same today/week/month surfaces).
 */
export function useWorkoutPlan(): WorkoutPlan | null {
  const { user } = useAuth();
  const email = user?.email ?? auth?.currentUser?.email ?? null;
  if (hasBakedPlan(email)) return RECOMP_PLAN;
  return null;
}

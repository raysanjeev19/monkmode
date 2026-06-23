import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { haptic } from "../lib/ui";

const field =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const label = "mb-1.5 block text-sm font-medium text-ink-mute";

export default function Onboarding() {
  const { profile, completeOnboarding } = useStore();
  const [name, setName] = useState(profile.name);
  const [weightKg, setWeight] = useState(String(profile.weightKg || ""));
  const [heightCm, setHeight] = useState(String(profile.heightCm || ""));
  const [targetWeightKg, setTarget] = useState(String(profile.targetWeightKg || ""));
  const [waterTargetMl, setWater] = useState(String(profile.waterTargetMl || 3000));

  const num = (v: string, d = 0) => (Number(v) > 0 ? Number(v) : d);

  const finish = () => {
    haptic(14);
    completeOnboarding({
      name: name.trim() || "Friend",
      weightKg: num(weightKg),
      heightCm: num(heightCm),
      targetWeightKg: num(targetWeightKg),
      waterTargetMl: num(waterTargetMl, 3000),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg px-5 pb-8 pt-safe">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8"
      >
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="MonkMode" className="mx-auto h-28 w-28 object-contain" />
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">
            Welcome to Monk<span className="text-primary">Mode</span>
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Let's set up your profile to get started.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="ob-name">What should we call you?</label>
            <input id="ob-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="ob-w">Weight (kg)</label>
              <input id="ob-w" type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeight(e.target.value)} placeholder="86" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="ob-h">Height (cm)</label>
              <input id="ob-h" type="number" inputMode="decimal" value={heightCm} onChange={(e) => setHeight(e.target.value)} placeholder="178" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="ob-t">Target weight (kg)</label>
              <input id="ob-t" type="number" inputMode="decimal" value={targetWeightKg} onChange={(e) => setTarget(e.target.value)} placeholder="71" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="ob-water">Water goal (ml)</label>
              <input id="ob-water" type="number" inputMode="numeric" value={waterTargetMl} onChange={(e) => setWater(e.target.value)} placeholder="3000" className={field} />
            </div>
          </div>
        </div>

        <button onClick={finish} className="btn-primary mt-7 flex w-full items-center justify-center gap-2 py-3.5 text-base">
          Get Started <ArrowRight size={18} />
        </button>
        <p className="mt-3 text-center text-xs text-ink-faint">You can change all of this later in Profile.</p>
      </motion.div>
    </div>
  );
}

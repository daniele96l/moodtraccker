"use client";

import { cn } from "@/lib/utils";
import type { MeditationPattern } from "@/lib/types";

interface BreathingCircleProps {
  phase: "inhale" | "hold" | "exhale" | "idle";
  pattern: MeditationPattern;
  secondsLeft: number;
}

const PHASE_LABELS = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  idle: "Ready",
};

export function BreathingCircle({
  phase,
  pattern,
  secondsLeft,
}: BreathingCircleProps) {
  const scale =
    phase === "inhale"
      ? "scale-110"
      : phase === "exhale"
        ? "scale-90"
        : "scale-100";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-mint-100 shadow-inner transition-transform duration-1000 ease-in-out",
          scale
        )}
        style={{
          background:
            "linear-gradient(135deg, #e8e0f8 0%, #d4ebe4 50%, #c8e8d8 100%)",
        }}
      >
        <div className="text-center">
          <p className="text-sm font-medium text-violet-700/80">
            {PHASE_LABELS[phase]}
          </p>
          {pattern !== "silent" && phase !== "idle" && (
            <p className="text-2xl font-light text-violet-900/70">
              {secondsLeft}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

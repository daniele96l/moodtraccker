"use client";

import { moodColor, MOOD_LABELS } from "@/lib/mood-colors";
import { useTheme } from "@/lib/hooks/use-theme";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MoodSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const isDark = useTheme() === "dark";

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col items-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full shadow-inner transition-colors duration-300"
          style={{ backgroundColor: moodColor(value, isDark) }}
        >
          <span
            className={cn(
              "text-3xl font-light tabular-nums",
              isDark ? "text-white/85" : "text-foreground/75"
            )}
          >
            {value}
          </span>
        </div>
        <p className="mt-4 text-sm font-medium tracking-wide text-foreground/80">
          {MOOD_LABELS[value]}
        </p>
      </div>

      <div className="space-y-3 px-1">
        <Slider
          min={1}
          max={10}
          step={1}
          value={[value]}
          onValueChange={(vals) => {
            const next = Array.isArray(vals) ? vals[0] : vals;
            if (typeof next === "number") onChange(next);
          }}
          className="py-1"
        />
        <div className="flex justify-between px-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="flex justify-between gap-1 px-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-2 flex-1 rounded-full transition-all",
              n === value ? "scale-110 ring-2 ring-primary/30 ring-offset-1" : "opacity-60 hover:opacity-100"
            )}
            style={{ backgroundColor: moodColor(n, isDark) }}
            aria-label={`Mood ${n}`}
          />
        ))}
      </div>
    </div>
  );
}

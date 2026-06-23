"use client";

import { MOOD_EMOJIS, MOOD_LABELS } from "@/lib/mood-colors";
import { Slider } from "@/components/ui/slider";

interface MoodSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl">{MOOD_EMOJIS[value]}</span>
        <div className="text-center">
          <p className="text-2xl font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{MOOD_LABELS[value]}</p>
        </div>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : vals;
          if (typeof next === "number") onChange(next);
        }}
        className="py-2"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "@/components/meditation/breathing-circle";
import { addMeditationSession } from "@/lib/local-store";
import type { MeditationPattern } from "@/lib/types";

const PRESETS = [3, 5, 10, 15];

const PATTERNS: { id: MeditationPattern; label: string; steps: number[] }[] = [
  { id: "box", label: "Box 4-4-4-4", steps: [4, 4, 4, 4] },
  { id: "478", label: "4-7-8", steps: [4, 7, 8] },
  { id: "silent", label: "Silent", steps: [] },
];

type Phase = "inhale" | "hold" | "exhale" | "idle";

interface MeditationTimerProps {
  dateKey: string;
  onComplete?: () => void;
}

export function MeditationTimer({ dateKey, onComplete }: MeditationTimerProps) {
  const [durationMin, setDurationMin] = useState(5);
  const [pattern, setPattern] = useState<MeditationPattern>("box");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(5 * 60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const stepIndex = useRef(0);
  const elapsed = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPatternSteps = useCallback(() => {
    return PATTERNS.find((p) => p.id === pattern)?.steps ?? [];
  }, [pattern]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPaused(false);
    setPhase("idle");
    setTotalSecondsLeft(durationMin * 60);
    stepIndex.current = 0;
    elapsed.current = 0;
  }, [durationMin]);

  const saveSession = useCallback(
    (seconds: number) => {
      if (seconds < 10) return;
      addMeditationSession(dateKey, seconds, pattern);
      onComplete?.();
    },
    [dateKey, pattern, onComplete]
  );

  const start = () => {
    setTotalSecondsLeft(durationMin * 60);
    elapsed.current = 0;
    stepIndex.current = 0;
    setRunning(true);
    setPaused(false);

    const steps = getPatternSteps();
    if (steps.length > 0) {
      setPhase("inhale");
      setPhaseSecondsLeft(steps[0]);
    } else {
      setPhase("idle");
    }
  };

  const stop = async () => {
    const seconds = elapsed.current;
    reset();
    await saveSession(seconds);
  };

  useEffect(() => {
    if (!running || paused) return;

    intervalRef.current = setInterval(() => {
      elapsed.current += 1;
      setTotalSecondsLeft((t) => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          saveSession(elapsed.current);
          setPhase("idle");
          return 0;
        }
        return t - 1;
      });

      const steps = getPatternSteps();
      if (steps.length === 0) return;

      setPhaseSecondsLeft((ps) => {
        if (ps <= 1) {
          const phases: Phase[] =
            pattern === "478"
              ? ["inhale", "hold", "exhale"]
              : ["inhale", "hold", "exhale", "hold"];
          const nextIdx = (stepIndex.current + 1) % steps.length;
          stepIndex.current = nextIdx;
          setPhase(phases[nextIdx % phases.length] ?? "inhale");
          return steps[nextIdx];
        }
        return ps - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, paused, getPatternSteps, pattern, saveSession]);

  useEffect(() => {
    if (!running) {
      setTotalSecondsLeft(durationMin * 60);
    }
  }, [durationMin, running]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5 rounded-xl border border-violet-100 bg-white/60 p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={durationMin === m ? "default" : "outline"}
            disabled={running}
            onClick={() => setDurationMin(m)}
          >
            {m}m
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PATTERNS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={pattern === p.id ? "default" : "outline"}
            disabled={running}
            onClick={() => setPattern(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <BreathingCircle
        phase={phase}
        pattern={pattern}
        secondsLeft={phaseSecondsLeft}
      />

      <p className="text-center text-2xl font-light tabular-nums text-violet-800/80">
        {formatTime(totalSecondsLeft)}
      </p>

      <div className="flex justify-center gap-2">
        {!running ? (
          <Button type="button" onClick={start}>
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={stop}>
              <Square className="mr-1 h-4 w-4" />
              Finish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

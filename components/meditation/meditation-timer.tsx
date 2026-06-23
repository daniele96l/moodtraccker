"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BreathingCircle } from "@/components/meditation/breathing-circle";
import { addMeditationSession } from "@/lib/firestore-store";
import {
  isBreathSoundsEnabled,
  playBreathCue,
  setBreathSoundsEnabled,
} from "@/lib/breathing-sounds";
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
  const [soundsOn, setSoundsOn] = useState(true);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(5 * 60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const stepIndex = useRef(0);
  const elapsed = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhase = useRef<Phase>("idle");

  useEffect(() => {
    setSoundsOn(isBreathSoundsEnabled());
  }, []);

  useEffect(() => {
    if (phase === prevPhase.current || phase === "idle") {
      prevPhase.current = phase;
      return;
    }
    if (running && !paused) {
      playBreathCue(phase);
    }
    prevPhase.current = phase;
  }, [phase, running, paused]);

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
    prevPhase.current = "idle";
  }, [durationMin]);

  const saveSession = useCallback(
    (seconds: number) => {
      if (seconds < 10) return;
      addMeditationSession(dateKey, seconds, pattern);
      playBreathCue("end");
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
    playBreathCue("start");

    const steps = getPatternSteps();
    if (steps.length > 0) {
      setPhase("inhale");
      setPhaseSecondsLeft(steps[0]);
    } else {
      setPhase("idle");
    }
  };

  const stop = () => {
    const seconds = elapsed.current;
    reset();
    saveSession(seconds);
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

  const toggleSounds = (on: boolean) => {
    setSoundsOn(on);
    setBreathSoundsEnabled(on);
    if (on) playBreathCue("start");
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          {soundsOn ? (
            <Volume2 className="h-4 w-4 text-primary/70" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="breath-sounds" className="text-xs text-muted-foreground">
            Breath sounds
          </Label>
        </div>
        <Switch
          id="breath-sounds"
          checked={soundsOn}
          onCheckedChange={toggleSounds}
          disabled={running}
        />
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Soft tones cue each phase — no need to watch the screen
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={durationMin === m ? "default" : "outline"}
            className="h-8 rounded-full px-3"
            disabled={running}
            onClick={() => setDurationMin(m)}
          >
            {m}m
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PATTERNS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={pattern === p.id ? "default" : "outline"}
            className="h-8 rounded-full px-3"
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

      <p className="text-center text-3xl font-light tabular-nums tracking-tight text-primary/80">
        {formatTime(totalSecondsLeft)}
      </p>

      <div className="flex justify-center gap-2">
        {!running ? (
          <Button type="button" className="rounded-full px-6" onClick={start}>
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
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
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={stop}
            >
              <Square className="mr-1 h-4 w-4" />
              Finish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

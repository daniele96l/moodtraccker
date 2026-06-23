type BreathCue = "inhale" | "hold" | "exhale" | "start" | "end";

const SOUND_PREF_KEY = "moodtracker_breath_sounds";

let ctx: AudioContext | null = null;

export function isBreathSoundsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(SOUND_PREF_KEY);
  return v !== "off";
}

export function setBreathSoundsEnabled(on: boolean) {
  localStorage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  frequency: number,
  duration: number,
  volume = 0.12,
  type: OscillatorType = "sine"
) {
  const audio = getCtx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + duration);
}

function sweep(from: number, to: number, duration: number) {
  const audio = getCtx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, audio.currentTime);
  osc.frequency.linearRampToValueAtTime(to, audio.currentTime + duration);
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, audio.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + duration);
}

export function playBreathCue(cue: BreathCue) {
  if (!isBreathSoundsEnabled()) return;
  try {
    switch (cue) {
      case "inhale":
        sweep(220, 392, 0.35);
        break;
      case "hold":
        tone(440, 0.15, 0.08);
        break;
      case "exhale":
        sweep(392, 196, 0.45);
        break;
      case "start":
        tone(330, 0.2, 0.1);
        break;
      case "end":
        tone(262, 0.5, 0.1);
        break;
    }
  } catch {
    // Audio unavailable
  }
}

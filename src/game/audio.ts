const KEY = "xdruid-audio-v1";

const LIGHT = [5, 6, 7, 8];
const HEAVY = [2, 3, 4, 5, 6, 7, 8];

export type SoundState = { volume: number; muted: boolean };

/** 0 is light wind, 1 is a heavy gust. */
export function heavyWind(time: number, day: number): number {
  const gust = 0.5 + 0.5 * Math.sin(day * 1.7 + time * Math.PI * 4);
  if (gust < 0.62) return 0;
  return Math.min(1, (gust - 0.62) / 0.38);
}

function stored(): SoundState {
  if (typeof localStorage === "undefined") return { volume: 0.7, muted: false };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "") as Partial<SoundState>;
    const volume = typeof raw.volume === "number" ? Math.max(0, Math.min(1, raw.volume)) : 0.7;
    const muted = raw.muted === true;
    return { volume, muted };
  } catch {
    return { volume: 0.7, muted: false };
  }
}

class Wind {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lightBus: GainNode | null = null;
  private heavyBus: GainNode | null = null;
  private lightSrc: AudioBufferSourceNode | null = null;
  private heavySrc: AudioBufferSourceNode | null = null;
  private lightGain: GainNode | null = null;
  private heavyGain: GainNode | null = null;
  private lightBufs: AudioBuffer[] = [];
  private heavyBufs: AudioBuffer[] = [];
  private volume = 0.7;
  private muted = false;
  private heavy = 0;
  private want = false;
  private loading = false;
  private listeners = new Set<() => void>();

  constructor() {
    const s = stored();
    this.volume = s.volume;
    this.muted = s.muted;
  }

  state(): SoundState {
    return { volume: this.volume, muted: this.muted };
  }

  on(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  private persist() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(this.state()));
    }
    this.emit();
  }

  /** Call from a click or key. Starts the context in that same turn. */
  arm() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC({ latencyHint: "playback" });
      this.master = this.ctx.createGain();
      this.lightBus = this.ctx.createGain();
      this.heavyBus = this.ctx.createGain();
      this.lightBus.connect(this.master);
      this.heavyBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply(0);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.ctx?.state === "suspended") void this.ctx.resume();
      });
      void this.preload();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.want = true;
    this.startLoops();
  }

  setVolume(volume: number) {
    this.arm();
    this.volume = Math.max(0, Math.min(1, volume));
    this.persist();
    this.apply(0.03);
  }

  toggleMute() {
    this.arm();
    this.muted = !this.muted;
    this.persist();
    this.apply(0.03);
  }

  setWind(amount: number) {
    if (!this.ctx) return;
    if (Math.abs(amount - this.heavy) < 0.03) return;
    this.heavy = Math.max(0, Math.min(1, amount));
    this.apply(0.5);
  }

  private apply(ramp: number) {
    if (!this.ctx || !this.master || !this.lightBus || !this.heavyBus) return;
    const now = this.ctx.currentTime;
    const master = this.muted ? 0 : this.volume * this.volume;
    this.master.gain.setTargetAtTime(master, now, Math.max(0.01, ramp));
    this.lightBus.gain.setTargetAtTime(0.35 + (1 - this.heavy) * 0.65, now, 0.4);
    this.heavyBus.gain.setTargetAtTime(this.heavy * 0.9, now, 0.45);
  }

  private ext() {
    return new Audio().canPlayType("audio/ogg; codecs=vorbis") ? "ogg" : "mp3";
  }

  private async load(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    const arr = await res.arrayBuffer();
    return this.ctx!.decodeAudioData(arr.slice(0));
  }

  private async preload() {
    if (this.loading || !this.ctx) return;
    this.loading = true;
    const ext = this.ext();
    try {
      const [light, heavy] = await Promise.all([
        this.load(`/game/audio/wind/light-5.${ext}`),
        this.load(`/game/audio/wind/heavy-2.${ext}`),
      ]);
      this.lightBufs.push(light);
      this.heavyBufs.push(heavy);
      this.startLoops();
    } catch {
      this.loading = false;
      return;
    }
    for (const n of LIGHT.slice(1)) {
      try {
        this.lightBufs.push(await this.load(`/game/audio/wind/light-${n}.${ext}`));
      } catch {
        /* skip a missing take */
      }
    }
    for (const n of HEAVY.slice(1)) {
      try {
        this.heavyBufs.push(await this.load(`/game/audio/wind/heavy-${n}.${ext}`));
      } catch {
        /* skip a missing take */
      }
    }
  }

  private loop(buf: AudioBuffer, bus: GainNode) {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.connect(bus);
    const src = this.ctx!.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);
    src.start();
    gain.gain.setTargetAtTime(1, this.ctx!.currentTime, 0.35);
    return { src, gain };
  }

  private startLoops() {
    if (!this.want || !this.ctx || !this.lightBus || !this.heavyBus) return;
    if (!this.lightSrc && this.lightBufs[0]) {
      const node = this.loop(this.lightBufs[0], this.lightBus);
      this.lightSrc = node.src;
      this.lightGain = node.gain;
    }
    if (!this.heavySrc && this.heavyBufs[0]) {
      const node = this.loop(this.heavyBufs[0], this.heavyBus);
      this.heavySrc = node.src;
      this.heavyGain = node.gain;
      window.setInterval(() => this.rotate(), 50000);
    }
    this.apply(0.2);
  }

  private rotate() {
    if (!this.ctx || !this.lightBus || !this.heavyBus) return;
    this.swap("light");
    this.swap("heavy");
  }

  private swap(which: "light" | "heavy") {
    const bufs = which === "light" ? this.lightBufs : this.heavyBufs;
    const bus = which === "light" ? this.lightBus : this.heavyBus;
    if (!this.ctx || !bus || bufs.length < 2) return;
    const buf = bufs[Math.floor(Math.random() * bufs.length)]!;
    const node = this.loop(buf, bus);
    const prev = which === "light" ? this.lightSrc : this.heavySrc;
    const prevGain = which === "light" ? this.lightGain : this.heavyGain;
    if (which === "light") {
      this.lightSrc = node.src;
      this.lightGain = node.gain;
    } else {
      this.heavySrc = node.src;
      this.heavyGain = node.gain;
    }
    if (prevGain) prevGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    if (prev) {
      window.setTimeout(() => {
        try {
          prev.stop();
        } catch {
          /* already stopped */
        }
        try {
          prev.disconnect();
          prevGain?.disconnect();
        } catch {
          /* already disconnected */
        }
      }, 1600);
    }
  }
}

const wind = new Wind();

export function soundState(): SoundState {
  return wind.state();
}

export function onSound(fn: () => void) {
  return wind.on(fn);
}

export function armWind() {
  wind.arm();
}

export function setVolume(volume: number) {
  wind.setVolume(volume);
}

export function toggleMute() {
  wind.toggleMute();
}

export function setWind(amount: number) {
  wind.setWind(amount);
}

import { takeSongs, type Sung } from "./birdsong.ts";
import { takeCatCries, type CatCry } from "./catsound.ts";

const KEY = "xdruid-audio-v1";

const LIGHT = [5, 6, 7, 8];
const HEAVY = [2, 3, 4, 5, 6, 7, 8];
const LIGHT_RAIN = [2, 3, 4];
const HEAVY_RAIN = [1, 2, 3, 4, 5];
const THUNDER = [1, 2, 3, 4, 5];

export type SoundState = {
  volume: number;
  weather: number;
  music: number;
  animals: number;
  muted: boolean;
};

const FRESH: SoundState = { volume: 0.7, weather: 1, music: 0.85, animals: 1, muted: false };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function stored(): SoundState {
  if (typeof localStorage === "undefined") return { ...FRESH };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "") as Partial<SoundState>;
    const num = (v: unknown, fallback: number) => (typeof v === "number" ? clamp01(v) : fallback);
    return {
      volume: num(raw.volume, FRESH.volume),
      weather: num(raw.weather, FRESH.weather),
      music: num(raw.music, FRESH.music),
      animals: num(raw.animals, FRESH.animals),
      muted: raw.muted === true,
    };
  } catch {
    return { ...FRESH };
  }
}

/** 0 is light wind, 1 is a heavy gust. */
export function heavyWind(time: number, day: number): number {
  const gust = 0.5 + 0.5 * Math.sin(day * 1.7 + time * Math.PI * 4);
  if (gust < 0.62) return 0;
  return Math.min(1, (gust - 0.62) / 0.38);
}

class Wind {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lightBus: GainNode | null = null;
  private heavyBus: GainNode | null = null;
  private rainBus: GainNode | null = null;
  private stormBus: GainNode | null = null;
  private lightSrc: AudioBufferSourceNode | null = null;
  private heavySrc: AudioBufferSourceNode | null = null;
  private lightGain: GainNode | null = null;
  private heavyGain: GainNode | null = null;
  private lightBufs: AudioBuffer[] = [];
  private heavyBufs: AudioBuffer[] = [];
  private rainBufs: AudioBuffer[] = [];
  private stormBufs: AudioBuffer[] = [];
  private thunderBufs: AudioBuffer[] = [];
  private rainSrc: AudioBufferSourceNode | null = null;
  private stormSrc: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private stormGain: GainNode | null = null;
  private birdBus: GainNode | null = null;
  private birdBufs = new Map<string, AudioBuffer>();
  private birdLoading = false;
  private catBus: GainNode | null = null;
  private catBufs = new Map<string, AudioBuffer>();
  private catLoading = false;
  private musicBus: GainNode | null = null;
  private musicBuf: AudioBuffer | null = null;
  private musicLive: AudioBufferSourceNode[] = [];
  private musicAt = 0;
  private musicSpan: { start: number; end: number } | null = null;
  private musicLoading = false;
  private sky: "clear" | "rain" | "storm" = "clear";
  private volume = FRESH.volume;
  private weather = FRESH.weather;
  private music = FRESH.music;
  private animals = FRESH.animals;
  private muted = false;
  private heavy = 0;
  private want = false;
  private loading = false;
  private listeners = new Set<() => void>();

  constructor() {
    const s = stored();
    this.volume = s.volume;
    this.weather = s.weather;
    this.music = s.music;
    this.animals = s.animals;
    this.muted = s.muted;
  }

  state(): SoundState {
    return { volume: this.volume, weather: this.weather, music: this.music, animals: this.animals, muted: this.muted };
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

  arm() {
    if (typeof window === "undefined") return;
    try {
      this.armContext();
    } catch {
      this.want = false;
    }
  }

  /** Call from a click or key. Starts the context in that same turn. */
  private armContext() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC({ latencyHint: "playback" });
      this.master = this.ctx.createGain();
      this.lightBus = this.ctx.createGain();
      this.heavyBus = this.ctx.createGain();
      this.rainBus = this.ctx.createGain();
      this.stormBus = this.ctx.createGain();
      this.lightBus.connect(this.master);
      this.heavyBus.connect(this.master);
      this.rainBus.connect(this.master);
      this.stormBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply(0);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.ctx?.state === "suspended") void this.ctx.resume();
      });
      void this.preload();
      void this.loadBirds();
      void this.loadCat();
      void this.loadMusic();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.want = true;
    this.startLoops();
  }

  setVolume(volume: number) {
    this.arm();
    this.volume = clamp01(volume);
    this.persist();
    this.apply(0.03);
  }

  setWeather(weather: number) {
    this.arm();
    this.weather = clamp01(weather);
    this.persist();
    this.apply(0.03);
  }

  setMusic(music: number) {
    this.arm();
    this.music = clamp01(music);
    this.persist();
    this.apply(0.03);
  }

  setAnimals(animals: number) {
    this.arm();
    this.animals = clamp01(animals);
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
    const weather = this.weather;
    this.master.gain.setTargetAtTime(master, now, Math.max(0.01, ramp));
    this.lightBus.gain.setTargetAtTime((0.35 + (1 - this.heavy) * 0.65) * weather, now, 0.4);
    this.heavyBus.gain.setTargetAtTime(this.heavy * 0.9 * weather, now, 0.45);
    const rain = this.sky === "clear" ? 0 : this.sky === "rain" ? 0.8 : 0.35;
    const storm = this.sky === "storm" ? 0.9 : this.sky === "rain" ? 0.12 : 0;
    this.rainBus?.gain.setTargetAtTime(rain * weather, now, 0.5);
    this.stormBus?.gain.setTargetAtTime(storm * weather, now, 0.5);
    this.musicBus?.gain.setTargetAtTime(0.85 * this.music, now, Math.max(0.01, ramp));
    this.birdBus?.gain.setTargetAtTime(0.9 * this.animals, now, Math.max(0.01, ramp));
    this.catBus?.gain.setTargetAtTime(0.8 * this.animals, now, Math.max(0.01, ramp));
  }

  setSky(sky: "clear" | "rain" | "storm") {
    if (this.sky === sky) return;
    this.sky = sky;
    this.apply(0.4);
  }

  sing(song: Sung) {
    if (!this.ctx || !this.birdBus || this.muted || this.birdBufs.size === 0) return;
    const now = this.ctx.currentTime + 0.03;
    const dx = song.x - song.px;
    const dist = Math.hypot(dx, song.y - song.py);
    const near = Math.max(0, 1 - dist / 260);
    const loud = song.gain * (0.28 + 0.72 * near);
    const pan = Math.max(-0.85, Math.min(0.85, dx / 150));
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.birdBus);
    song.notes.forEach((n, i) => {
      const key = n.long ? `${n.p}L` : `${n.p}${i % 2}`;
      const buf = this.birdBufs.get(key);
      if (!buf) return;
      const rate = n.rate ?? 1;
      const when = now + n.at;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(Math.max(0.02, (n.gain ?? 1) * loud), when);
      gain.connect(panner);
      const src = this.ctx!.createBufferSource();
      src.buffer = buf;
      src.playbackRate.setValueAtTime(rate, when);
      src.connect(gain);
      src.start(when);
      src.stop(when + buf.duration / rate + 0.02);
      src.onended = () => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch {
          /* already gone */
        }
      };
    });
  }

  private async loadBirds() {
    if (this.birdLoading || !this.ctx || !this.master) return;
    this.birdLoading = true;
    this.birdBus = this.ctx.createGain();
    this.birdBus.gain.value = 0.9 * this.animals;
    this.birdBus.connect(this.master);
    const ids = ["vl0", "vl1", "l0", "l1", "m0", "m1", "h0", "h1", "vh0", "vh1", "vlL", "lL", "mL", "hL", "vhL"];
    await Promise.all(
      ids.map(async (id) => {
        try {
          this.birdBufs.set(id, await this.load(`/game/audio/birds/${id}.wav`));
        } catch {
          /* a missing syllable is skipped */
        }
      }),
    );
  }

  thunder() {
    if (!this.ctx || !this.master || this.thunderBufs.length === 0) return;
    const buf = this.thunderBufs[Math.floor(Math.random() * this.thunderBufs.length)]!;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.95 * this.weather, this.ctx.currentTime);
    gain.connect(this.master);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.start();
    src.onended = () => {
      try {
        src.disconnect();
        gain.disconnect();
      } catch {
        /* already gone */
      }
    };
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
    for (const n of LIGHT_RAIN) {
      try {
        this.rainBufs.push(await this.load(`/game/audio/rain/light-${n}.${ext}`));
      } catch {
        /* skip a missing take */
      }
    }
    for (const n of HEAVY_RAIN) {
      try {
        this.stormBufs.push(await this.load(`/game/audio/rain/heavy-${n}.${ext}`));
      } catch {
        /* skip a missing take */
      }
    }
    for (const n of THUNDER) {
      try {
        this.thunderBufs.push(await this.load(`/game/audio/thunder/thunder-${n}.${ext}`));
      } catch {
        /* skip a missing take */
      }
    }
    this.startLoops();
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
    if (!this.rainSrc && this.rainBufs[0] && this.rainBus) {
      const node = this.loop(this.rainBufs[0], this.rainBus);
      this.rainSrc = node.src;
      this.rainGain = node.gain;
    }
    if (!this.stormSrc && this.stormBufs[0] && this.stormBus) {
      const node = this.loop(this.stormBufs[0], this.stormBus);
      this.stormSrc = node.src;
      this.stormGain = node.gain;
    }
    this.apply(0.2);
    this.startMusic();
  }

  cat(cry: CatCry) {
    if (!this.ctx || !this.catBus || this.muted || this.catBufs.size === 0) return;
    const keys = [...this.catBufs.keys()].filter((k) => k.startsWith(`${cry.kind}-`));
    const key = keys[Math.floor(Math.random() * keys.length)];
    const buf = key ? this.catBufs.get(key) : undefined;
    if (!buf) return;
    const now = this.ctx.currentTime + 0.02;
    const dx = cry.x - cry.px;
    const dist = Math.hypot(dx, cry.y - cry.py);
    const near = Math.max(0, 1 - dist / 220);
    const loud = cry.gain * (0.22 + 0.78 * near);
    const pan = Math.max(-0.8, Math.min(0.8, dx / 140));
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    panner.connect(this.catBus);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.02, loud), now);
    gain.connect(panner);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.start(now);
    src.onended = () => {
      try {
        src.disconnect();
        gain.disconnect();
        panner.disconnect();
      } catch {
        /* already gone */
      }
    };
  }

  private async loadCat() {
    if (this.catLoading || !this.ctx || !this.master) return;
    this.catLoading = true;
    this.catBus = this.ctx.createGain();
    this.catBus.gain.value = 0.8 * this.animals;
    this.catBus.connect(this.master);
    const ids = [
      "short-01", "short-02", "short-03", "short-04", "short-05", "short-06",
      "long-01", "long-02", "long-03", "long-04",
      "trill-01", "trill-02", "trill-03", "trill-04",
      "lick-01", "lick-02", "lick-03",
      "groan-01", "groan-02", "groan-03",
    ];
    await Promise.all(
      ids.map(async (id) => {
        try {
          this.catBufs.set(id, await this.load(`/game/audio/cat/${id}.wav`));
        } catch {
          /* a missing cry is skipped */
        }
      }),
    );
  }

  private async loadMusic() {
    if (this.musicLoading || this.musicBuf || !this.ctx || !this.master) return;
    this.musicLoading = true;
    try {
      this.musicBuf = await this.load("/game/audio/theme.mp3");
      this.startMusic();
    } catch {
      this.musicLoading = false;
    }
  }

  private measureMusic(buf: AudioBuffer): void {
    const data = buf.getChannelData(0);
    const sr = buf.sampleRate;
    const thr = 0.008;
    let i0 = 0;
    while (i0 < data.length && Math.abs(data[i0]!) < thr) i0++;
    let i1 = data.length - 1;
    while (i1 > i0 && Math.abs(data[i1]!) < thr) i1--;
    this.musicSpan = {
      start: Math.max(0, i0 / sr - 0.03),
      end: Math.min(buf.duration, i1 / sr + 0.06),
    };
  }

  private queueMusicPass(when: number, fadeIn: boolean): void {
    const buf = this.musicBuf;
    const ctx = this.ctx;
    const bus = this.musicBus;
    const span = this.musicSpan;
    if (!buf || !ctx || !bus || !span) return;
    const len = Math.max(0.5, span.end - span.start);
    const fade = Math.min(3.2, len / 5);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(bus);
    const t0 = when;
    const t1 = when + len;
    gain.gain.setValueAtTime(fadeIn ? 0 : 1, t0);
    if (fadeIn) gain.gain.linearRampToValueAtTime(1, t0 + fade);
    gain.gain.setValueAtTime(1, Math.max(t0 + fade, t1 - fade));
    gain.gain.linearRampToValueAtTime(0, t1);
    try {
      src.start(t0, span.start, len);
    } catch {
      return;
    }
    this.musicLive.push(src);
    src.onended = () => {
      gain.disconnect();
      src.disconnect();
      this.musicLive = this.musicLive.filter((n) => n !== src);
      if (!this.want || !this.musicBuf || !this.musicSpan) return;
      this.queueMusicPass(this.musicAt, true);
      this.musicAt += len - fade;
    };
  }

  private startMusic() {
    if (!this.want || !this.ctx || !this.master || !this.musicBuf || this.musicLive.length) return;
    if (!this.musicBus) {
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.85 * this.music;
      this.musicBus.connect(this.master);
    }
    if (!this.musicSpan) this.measureMusic(this.musicBuf);
    const span = this.musicSpan;
    if (!span) return;
    const len = Math.max(0.5, span.end - span.start);
    const fade = Math.min(3.2, len / 5);
    const t = this.ctx.currentTime + 0.05;
    this.musicAt = t + (len - fade);
    this.queueMusicPass(t, false);
    this.queueMusicPass(this.musicAt, true);
    this.musicAt += len - fade;
  }

  private rotate() {
    if (!this.ctx || !this.lightBus || !this.heavyBus) return;
    this.swap("light", this.lightBufs, this.lightBus);
    this.swap("heavy", this.heavyBufs, this.heavyBus);
    this.swap("rain", this.rainBufs, this.rainBus);
    this.swap("storm", this.stormBufs, this.stormBus);
  }

  private swap(which: "light" | "heavy" | "rain" | "storm", bufs: AudioBuffer[], bus: GainNode | null) {
    if (!this.ctx || !bus || bufs.length < 2) return;
    const buf = bufs[Math.floor(Math.random() * bufs.length)]!;
    const node = this.loop(buf, bus);
    const prev =
      which === "light" ? this.lightSrc : which === "heavy" ? this.heavySrc : which === "rain" ? this.rainSrc : this.stormSrc;
    const prevGain =
      which === "light" ? this.lightGain : which === "heavy" ? this.heavyGain : which === "rain" ? this.rainGain : this.stormGain;
    if (which === "light") {
      this.lightSrc = node.src;
      this.lightGain = node.gain;
    } else if (which === "heavy") {
      this.heavySrc = node.src;
      this.heavyGain = node.gain;
    } else if (which === "rain") {
      this.rainSrc = node.src;
      this.rainGain = node.gain;
    } else {
      this.stormSrc = node.src;
      this.stormGain = node.gain;
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

export function setWeatherVolume(weather: number) {
  wind.setWeather(weather);
}

export function setMusicVolume(music: number) {
  wind.setMusic(music);
}

export function setAnimalVolume(animals: number) {
  wind.setAnimals(animals);
}

export function toggleMute() {
  wind.toggleMute();
}

export function setWind(amount: number) {
  wind.setWind(amount);
}

let heardBolts = 0;

export function syncSky(sky: "clear" | "rain" | "storm", bolts: number) {
  wind.setSky(sky);
  if (bolts > heardBolts) {
    heardBolts = bolts;
    wind.thunder();
  }
}

export function playBirdsongs() {
  if (!wind.state() || wind.state().muted) {
    takeSongs();
    takeCatCries();
    return;
  }
  for (const song of takeSongs()) wind.sing(song);
  for (const cry of takeCatCries()) wind.cat(cry);
}

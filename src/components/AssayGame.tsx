import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { IconRef, GameState, Item, PanelId, EquipSlot } from "@/game/content";
import {
  MASS_CAP,
  SAVE_KEY,
  WORLD_H,
  WORLD_W,
  VIEW_H,
  VIEW_W,
  MEADOW,
  clockLabel,
  createGame,
  defOf,
  ensureHealth,
  ensureReaper,
  ensureHand,
  ensureSkills,
  isNight,
  skyLabel,
  liturgyName,
  SKILL_IDS,
  SKILL_NAME,
  SKILL_NOTE,
  skillLevel,
  skillFill,
} from "@/game/content";
import { farmRackAt, pressFarmRack } from "@/game/paint/farmPortals";
import { drawMarginSky } from "@/game/paint/marginSky";
import { ART, loadSheets, type Sheets } from "@/game/assets";
import { armWind, heavyWind, onSound, playBirdsongs, setAnimalVolume, setMusicVolume, setVolume, setWeatherVolume, setWind, soundState, syncSky, toggleMute } from "@/game/audio";
import { drawWorld } from "@/game/draw";
import {
  assignHotbar,
  bedsAlive,
  buyFineCan,
  coinCount,
  craftKit,
  craftRepairTool,
  craftSeeds,
  deposit,
  dropItem,
  equipItem,
  unequipItem,
  bestSlot,
  examineAt,
  facingPoint,
  findItem,
  giveItem,
  interact,
  moveFromBackpack,
  moveToBackpack,
  onF,
  onQ,
  promptAt,
  selectHotbar,
  sellItem,
  step,
  swapPack,
  takeItem,
  totalMass,
  withdraw,
  releaseGoat,
  type InteractResult,
} from "@/game/logic";
import { BAK1, BAK2, readSaveFrom, writeSave, type SaveStore } from "@/game/save";
import { MapEditor, builderDevAllowed } from "@/components/MapEditor";
import { loadDevSprites, snapSprite, devSpriteBook, placeBounds, setSpriteGhost, setSpritePick, spriteIndexAt, fitScale, SCALES, type SpriteBook, type SpritePlace } from "@/game/dev-sprites";
import { liftDevSprite, pinDevAsset, replaceDevPlaced, saveDevSprite } from "@/game/dev-sprite-api";
import { assetFile } from "@/game/assets";
import { copyText } from "@/game/copy-text";
import type { Rect } from "@/game/content";
import {
  blockRect,
  drawEditorBox,
  editorOrder,
  loadTileLayer,
  snapRect,
  pickRect,
  flushTiles,
  type PaintId,
  type SelMode,
} from "@/game/tiles";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
      setSteer: (v: number) => void;
    };
  }
}

const SHEET = {
  tools: { url: `/game/icons/tools.png?v=${ART}`, w: 128, h: 96 },
  veg: { url: `/game/icons/veggies.png?v=${ART}`, w: 160, h: 192 },
  cooked: { url: `/game/icons/cooked.png?v=${ART}`, w: 160, h: 160 },
  eggs: { url: `/game/icons/eggs.png?v=${ART}`, w: 96, h: 64 },
  dairy: { url: `/game/icons/dairy.png?v=${ART}`, w: 256, h: 96 },
  res: { url: `/game/icons/resources.png?v=${ART}`, w: 176, h: 32 },
  fish: { url: `/game/icons/fish.png?v=${ART}`, w: 320, h: 352 },
} as const;

const CONTROLS = `WASD or arrows    Move. 4 directions.
Shift             Walk faster while stamina holds. A heavy pack refuses.
Left click        Use the highlighted tile.
Right click       Examine, or a short menu.
Mouse wheel       Zoom. Scroll up closer, down further out.
E or Space        Use the tile you face.
Q                 Activate or eat the hotbar slot.
F                 Stow or draw the hand item.
1–8               Hotbar. Food is eaten with Q, not on select.
Tab               Cycle the hotbar.
I                 Field pack, 28 slots.
C                 Body.
B                 Shed vault, when you stand at the chest.
M                 Yard legend.
Esc               Pause. This yard is the whole world.
At night, E on the shed or the bathtub sleeps and saves. B still opens the chest.

Gamepad: stick move, A use, X pack, Y body, B cancel, LB/RB hotbar, LT walk-fast, Start pause.`;

function placeName(s: GameState): string {
  const wing = s.wing ?? 0;
  if (wing === 1) return "Svarga";
  if (wing === -1) return "Naraka";
  if (Math.abs(s.x - 40) < 36 && s.y > 150 && s.y < 236) return "Naraka gate";
  if (Math.abs(s.x - 308) < 36 && s.y > 150 && s.y < 236) return "Svarga gate";
  if (s.x >= 240 && s.x <= 296 && s.y >= 76 && s.y <= 108) return "Goat pen";
  if (Math.hypot(s.x - 260, s.y - 146) < 28) return "House";
  if (Math.hypot(s.x - 172, s.y - 380) < 36) return "Courtyard, magic plot";
  if (s.y >= 192 && s.y < 236) return "Sidewalk";
  if (s.y < 192) return "Farm";
  if (s.y < 528) return "Courtyard";
  return "Below the yard";
}

type Menu = { x: number; y: number; rows: { label: string; run: () => void }[] };

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

function feedKonami(buf: { current: string[] }, code: string): boolean {
  const next = KONAMI[buf.current.length];
  if (code === next) {
    buf.current.push(code);
    if (buf.current.length === KONAMI.length) {
      buf.current = [];
      return true;
    }
    return false;
  }
  buf.current = code === KONAMI[0] ? [code] : [];
  return false;
}

function store(): SaveStore {
  return {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
    del: (key) => localStorage.removeItem(key),
  };
}

function readSave(): GameState | null {
  try {
    return readSaveFrom(store());
  } catch {
    return null;
  }
}

function persist(s: GameState) {
  writeSave(store(), s);
}

function Icon({ icon, size = 28 }: { icon: IconRef; size?: number }) {
  if (icon.sheet === "coin") {
    return (
      <span
        className="icon"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          background: "radial-gradient(circle at 40% 40%, #ffe9a0, #e2b657 60%, #8a6230)",
          borderRadius: "50%",
        }}
      />
    );
  }
  if (icon.sheet === "pack") {
    return (
      <span
        className="icon"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          background: "#6b4428",
          boxShadow: "inset 0 0 0 3px #3d2818",
        }}
      />
    );
  }
  if (icon.sheet === "wear") {
    const sc = size / icon.w;
    return (
      <span
        className="icon"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          backgroundImage: "url(/game/ui/gear.png)",
          backgroundPosition: `${-icon.x * sc}px ${-icon.y * sc}px`,
          backgroundSize: `${128 * sc}px ${32 * sc}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    );
  }
  const meta = SHEET[icon.sheet as keyof typeof SHEET];
  if (!meta) return null;
  const sc = size / icon.w;
  return (
    <span
      className="icon"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: `url(${meta.url})`,
        backgroundPosition: `${-icon.x * sc}px ${-icon.y * sc}px`,
        backgroundSize: `${meta.w * sc}px ${meta.h * sc}px`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

function itemLabel(it: Item): string {
  const d = defOf(it);
  const qty = d.stack && it.qty > 1 ? ` ×${it.qty}` : "";
  const floor = d.kind === "tool" ? ` · Q${Math.round(it.quality)} · Floor ${it.floor.toFixed(1)}` : ` · Floor ${Math.floor(it.floor * (d.stack ? it.qty : 1))}`;
  const water = d.waterMax ? ` · water ${it.water ?? 0}/${d.waterMax}` : "";
  return `${d.name}${qty}${floor}${water}. ${it.noteOf ? "Paper. No use. No weight." : d.blurb}`;
}

function SoundBar({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="sound-row">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function SoundControls() {
  const [snd, setSnd] = useState(soundState);
  useEffect(() => onSound(() => setSnd(soundState())), []);
  return (
    <div className="sound-stack" onPointerDown={(e) => e.stopPropagation()}>
      <SoundBar label="Weather" value={snd.weather} onChange={setWeatherVolume} />
      <SoundBar label="Music" value={snd.music} onChange={setMusicVolume} />
      <SoundBar label="Animals" value={snd.animals} onChange={setAnimalVolume} />
      <div className="sound-row">
        <span>Total</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={snd.volume}
          aria-label="Total volume"
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <button
          type="button"
          className="slot"
          style={{ width: "auto", height: 22, padding: "0 6px" }}
          aria-pressed={snd.muted}
          onClick={() => toggleMute()}
        >
          {snd.muted ? "Muted" : "Mute"}
        </button>
      </div>
    </div>
  );
}

function needColor(value: number): string {
  if (value > 70) return "#e07a5f";
  if (value > 45) return "#e2b657";
  return "#7dba5a";
}

function Vital({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="vital">
      <b>{label}</b>
      <div className="meter">
        <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
      <i>{value}</i>
    </div>
  );
}

function Need({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>
        {label} {Math.round(value)}
      </span>
      <div className="meter">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: needColor(value) }} />
      </div>
    </div>
  );
}

export function AssayGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const sheetsRef = useRef<Sheets | null>(null);
  const keysRef = useRef(new Set<string>());
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const camRef = useRef({ scale: 1, ox: 0, oy: 0 });
  const zoomRef = useRef(1);
  const wheelAcc = useRef(0);
  const screenRef = useRef<"title" | "play">("title");
  const panelRef = useRef<PanelId | null>(null);
  const stickRef = useRef({ x: 0, y: 0 });
  const runHold = useRef(false);
  const skipTap = useRef(false);
  const padRef = useRef<boolean[]>(Array.from({ length: 16 }, () => false));
  const konamiRef = useRef<string[]>([]);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [screen, setScreen] = useState<"title" | "play">("title");
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [touch, setTouch] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [running, setRunning] = useState(false);
  const [wipe, setWipe] = useState(false);
  const [vaultSel, setVaultSel] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [devHere, setDevHere] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editMode, setEditMode] = useState<SelMode>("rect");
  const [editTile] = useState<PaintId>("grass");
  const [editSel, setEditSel] = useState<Rect | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [sprites, setSprites] = useState<SpriteBook>({ rev: 0, library: [], placed: [] });
  const [armed, setArmed] = useState<string | null>(null);
  const [stampIx, setStampIx] = useState(-1);
  const armedRef = useRef<string | null>(null);
  const stampRef = useRef(-1);
  const histRef = useRef<SpritePlace[][]>([]);
  const redoRef = useRef<SpritePlace[][]>([]);
  const editApi = useRef({
    undo: () => {},
    redo: () => {},
    save: () => {},
    commit: async (_next: SpritePlace[], _msg: string) => {},
  });
  const editorRef = useRef({
    open: false,
    mode: "rect" as SelMode,
    tile: "grass" as PaintId,
    drag: null as { x: number; y: number } | null,
    sprite: null as { index: number; ox: number; oy: number } | null,
    sel: null as Rect | null,
    live: null as Rect | null,
  });

  const api = useRef({
    onKey: (_code: string) => {},
    useAt: (_x: number, _y: number) => {},
    toggle: (_p: PanelId) => {},
    apply: (_r: InteractResult) => {},
  });

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    editorRef.current.open = editorOpen;
    editorRef.current.mode = editMode;
    editorRef.current.tile = editTile;
    editorRef.current.sel = editSel;
    if (!editorOpen) editorRef.current.live = null;
  }, [editorOpen, editMode, editTile, editSel]);
  useEffect(() => {
    armedRef.current = armed;
  }, [armed]);

  useEffect(() => {
    const end = (e: PointerEvent) => {
      const ed = editorRef.current;
      if (!ed.open || !ed.drag) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cam = camRef.current;
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const w = { x: (mx - cam.ox) / cam.scale, y: (my - cam.oy) / cam.scale };
      if (ed.mode === "rect") {
        const box = snapRect(ed.drag, w);
        ed.sel = box;
        ed.live = null;
        setEditSel(box);
      } else if (ed.mode === "move" && ed.sprite) {
        const drag = ed.sprite;
        ed.sprite = null;
        ed.drag = null;
        setSpriteGhost(null);
        const at = snapSprite(w.x - drag.ox, w.y - drag.oy);
        const next = devSpriteBook().placed.map((p, i) => (i === drag.index ? { ...p, x: at.x, y: at.y } : { ...p }));
        void editApi.current.commit(next, `Moved to ${at.x}, ${at.y}.`);
      }
      ed.drag = null;
      ed.sprite = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  useEffect(() => {
    let dead = false;
    const giveUp = window.setTimeout(() => {
      if (dead) return;
      if (!sheetsRef.current) sheetsRef.current = {};
      if (!stateRef.current) {
        try {
          stateRef.current = readSave() ?? createGame();
        } catch {
          stateRef.current = createGame();
        }
      }
      ensureSkills(stateRef.current);
      ensureHealth(stateRef.current);
      ensureReaper(stateRef.current);
      ensureHand(stateRef.current);
      setReady(true);
    }, 7000);
    loadSheets()
      .then((sheets) => {
        if (dead) return;
        sheetsRef.current = sheets;
        loadTileLayer();
        loadDevSprites().then((book) => setSprites(book)).catch(() => {});
        if (!stateRef.current) {
          try {
            stateRef.current = readSave() ?? createGame();
            ensureSkills(stateRef.current);
            ensureHealth(stateRef.current);
            ensureReaper(stateRef.current);
            ensureHand(stateRef.current);
          } catch {
            stateRef.current = createGame();
          }
        }
        setReady(true);
        if (new URLSearchParams(location.search).has("qa")) {
          screenRef.current = "play";
          setScreen("play");
        }
      })
      .catch(() => {
        if (!sheetsRef.current) sheetsRef.current = {};
        setReady(true);
      })
      .finally(() => window.clearTimeout(giveUp));
    const touchOn = () => setTouch(true);
    window.addEventListener("touchstart", touchOn, { passive: true });
    const coarse = window.matchMedia("(pointer: coarse)");
    const phone = window.matchMedia("(max-width: 720px)");
    if (coarse.matches) setTouch(true);
    const onPhone = () => setNarrow(phone.matches);
    onPhone();
    phone.addEventListener("change", onPhone);
    setDevHere(builderDevAllowed());
    return () => {
      dead = true;
      window.removeEventListener("touchstart", touchOn);
      phone.removeEventListener("change", onPhone);
      window.clearTimeout(giveUp);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && editorRef.current.open) {
        e.preventDefault();
        editApi.current.save();
        return;
      }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && editorRef.current.open) {
        e.preventDefault();
        if (e.shiftKey) editApi.current.redo();
        else editApi.current.undo();
        return;
      }
      keysRef.current.add(e.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      api.current.onKey(e.code);
    };
    const up = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      keysRef.current.delete(e.code);
    };
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const levels = [0.2, 0.35, 0.55, 1, 1.5, 2, 3, 4];
    const onWheel = (e: WheelEvent) => {
      if (screenRef.current !== "play") return;
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= 400;
      wheelAcc.current += dy;
      if (Math.abs(wheelAcc.current) < 60) return;
      const out = wheelAcc.current > 0;
      wheelAcc.current = 0;
      let i = levels.findIndex((z) => Math.abs(z - zoomRef.current) < 0.05);
      if (i < 0) i = 0;
      i = Math.max(0, Math.min(levels.length - 1, i + (out ? -1 : 1)));
      zoomRef.current = levels[i] ?? 1;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 800;
    const hudEvery = coarse ? 0.5 : 0.2;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const sheets = sheetsRef.current;
      const s = stateRef.current;
      if (canvas && sheets && s) {
        const dpr = coarse ? 1 : Math.min(2, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const fit = Math.min(w / VIEW_W, h / VIEW_H);
        const base = Math.max(1, Math.floor(fit));
        const zoom = zoomRef.current;
        const brace = s.cast && s.wing === 1 ? -1 : s.cast && s.wing === -1 ? 1 : 0;
        let ox: number;
        let oy: number;
        let skyW: number;
        let skyH: number;
        let scale: number;
        if (zoom < 1) {
          const viewH = Math.min(WORLD_H, VIEW_H / zoom);
          const viewW = WORLD_W;
          scale = Math.min(w / viewW, h / viewH);
          const camY = Math.max(0, Math.min(Math.max(0, WORLD_H - viewH), s.y - viewH / 2 + brace));
          ox = Math.floor((w - viewW * scale) / 2);
          oy = Math.floor((h - viewH * scale) / 2 - camY * scale);
          skyW = viewW * scale;
          skyH = viewH * scale;
        } else {
          scale = Math.max(base, Math.round(base * zoom));
          if (zoom <= 1) {
            const follow = Math.round(s.y - VIEW_H / 2);
            const camY = Math.max(0, Math.min(WORLD_H - VIEW_H, follow + brace));
            ox = Math.floor((w - VIEW_W * scale) / 2);
            oy = Math.floor((h - VIEW_H * scale) / 2) - camY * scale;
            skyW = VIEW_W * scale;
            skyH = VIEW_H * scale;
          } else {
            const viewW = w / scale;
            const viewH = h / scale;
            const pad = 24;
            const camX = Math.max(-pad, Math.min(WORLD_W - viewW + pad, s.x - viewW / 2));
            const camY = Math.max(-pad, Math.min(WORLD_H - viewH + pad, s.y - viewH / 2 + brace));
            ox = Math.round(w / 2 - (camX + viewW / 2) * scale);
            oy = Math.round(h / 2 - (camY + viewH / 2) * scale);
            skyW = WORLD_W * scale;
            skyH = WORLD_H * scale;
          }
        }
        camRef.current = { scale, ox, oy };
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          drawMarginSky(ctx, w, h, ox, oy, skyW, skyH, performance.now() / 1000);
          ctx.setTransform(scale, 0, 0, scale, ox, oy);
          ctx.imageSmoothingEnabled = false;
          const keys = keysRef.current;
          const stick = stickRef.current;
          let mx = stick.x;
          let my = stick.y;
          if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
          if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
          if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
          if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
          let run = keys.has("ShiftLeft") || keys.has("ShiftRight") || runHold.current;
          const pads = navigator.getGamepads?.();
          const gp = pads ? pads[0] : null;
          if (gp && screenRef.current === "play") {
            const ax = gp.axes[0] ?? 0;
            const ay = gp.axes[1] ?? 0;
            if (Math.hypot(ax, ay) > 0.28) {
              mx += ax;
              my += ay;
            }
            if (gp.buttons[6]?.pressed || (gp.axes[4] ?? 0) > 0.45) run = true;
            const hit = (i: number) => !!gp.buttons[i]?.pressed && !padRef.current[i];
            const freed = (code: string) => {
              if (!feedKonami(konamiRef, code)) return false;
              s.message = releaseGoat(s);
              persist(s);
              return true;
            };
            if (hit(12)) freed("ArrowUp");
            if (hit(13)) freed("ArrowDown");
            if (hit(14)) freed("ArrowLeft");
            if (hit(15)) freed("ArrowRight");
            if (hit(1)) {
              const done = freed("KeyB");
              if (!done && konamiRef.current.length === 0 && panelRef.current) api.current.toggle(panelRef.current);
            }
            if (hit(0) && !freed("KeyA")) api.current.useAt(facingPoint(s).x, facingPoint(s).y);
            if (hit(2)) api.current.toggle("pack");
            if (hit(3)) api.current.toggle("body");
            if (hit(4)) selectHotbar(s, s.selected - 1);
            if (hit(5)) selectHotbar(s, s.selected + 1);
            if (hit(9)) api.current.toggle("pause");
            for (let i = 0; i < 16; i++) padRef.current[i] = !!gp.buttons[i]?.pressed;
          }
          if (screenRef.current === "play" && s) {
            try {
              step(s, dt, {
                mx,
                my,
                run,
                frozen: panelRef.current !== null,
              });
              setWind(heavyWind(s.time, s.day));
              syncSky(s.weather, s.bolts);
              playBirdsongs();
              if (s.uiEvent) {
                const ev = s.uiEvent;
                s.uiEvent = undefined;
                api.current.apply(ev);
              }
              const tool = findItem(s, s.activeId);
              drawWorld(ctx, s, sheets, hoverRef.current, !!tool && defOf(tool).tool === "shovel");
            } catch (err) {
              s.message = err instanceof Error ? err.message : "The yard hit a snag.";
            }
          } else {
            try {
              drawWorld(ctx, s, sheets, hoverRef.current, false);
            } catch {
              /* Keep the title up if a frame fails. */
            }
          }
          if (editorRef.current.open) drawEditorBox(ctx, editorRef.current.live ?? editorRef.current.sel);
          window.__controlsTest = {
            getYaw: () => (s.dir === "e" ? Math.PI / 2 : s.dir === "w" ? -Math.PI / 2 : s.dir === "n" ? 0 : Math.PI),
            getSpeed: () => s.speed,
            getX: () => s.x,
            getY: () => s.y,
            setKeys: (codes) => {
              keysRef.current = new Set(codes);
            },
            setSteer: () => {},
          };
        }
      }
      acc += dt;
      if (acc > hudEvery) {
        acc = 0;
        setTick((n) => (n + 1) % 100000);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = stateRef.current;
  const bump = () => setTick((n) => n + 1);

  const apply = (r: InteractResult) => {
    const cur = stateRef.current;
    if (!cur) return;
    if (r.msg) cur.message = r.msg;
    if (r.save) persist(cur);
    if (r.panel) {
      panelRef.current = r.panel;
      setPanel(r.panel);
    }
    if (r.summary) {
      panelRef.current = "summary";
      setPanel("summary");
    }
    bump();
  };
  api.current.apply = apply;

  const useAt = (x: number, y: number) => {
    const cur = stateRef.current;
    if (!cur || screenRef.current !== "play") return;
    if (panelRef.current) return;
    if ((cur.wing ?? 0) === 0) {
      const rack = farmRackAt(x, y);
      if (rack >= 0) {
        cur.message = pressFarmRack(cur, rack);
        persist(cur);
        bump();
        return;
      }
    }
    apply(interact(cur, x, y));
  };
  api.current.useAt = useAt;

  const toggle = (p: PanelId) => {
    if (screenRef.current !== "play") {
      if (p === "controls" || p === "pause") {
        setPanel((cur) => (cur === "controls" ? null : "controls"));
      }
      return;
    }
    setPanel((cur) => {
      const next = cur === p ? null : p;
      panelRef.current = next;
      return next;
    });
    setMenu(null);
  };
  api.current.toggle = toggle;

  api.current.onKey = (code) => {
    const cur = stateRef.current;
    if (screenRef.current !== "play" || !cur) {
      if (code === "Escape") setPanel(null);
      return;
    }
    if (feedKonami(konamiRef, code)) {
      cur.message = releaseGoat(cur);
      persist(cur);
      bump();
      return;
    }
    if (code === "Escape") {
      if (menu) setMenu(null);
      else toggle("pause");
      return;
    }
    if (code === "KeyI") return toggle("pack");
    if (code === "KeyC") return toggle("body");
    if (code === "KeyM") return toggle("map");
    if (code === "KeyB") {
      if (konamiRef.current.length > 0) return;
      if (Math.hypot(cur.x - 260, cur.y - 146) > 40) {
        cur.message = "Stand at the house.";
        bump();
        return;
      }
      return toggle("vault");
    }
    if (panelRef.current && code !== "KeyE" && code !== "Space") {
      if (code === "Tab") selectHotbar(cur, cur.selected + 1);
      return;
    }
    if (code === "KeyE" || code === "Space") {
      const p = facingPoint(cur);
      useAt(p.x, p.y);
      return;
    }
    if (code === "KeyQ") {
      cur.message = onQ(cur);
      bump();
      return;
    }
    if (code === "KeyF") {
      cur.message = onF(cur);
      bump();
      return;
    }
    if (code === "Tab") {
      selectHotbar(cur, cur.selected + 1);
      bump();
      return;
    }
    const num = /^Digit([1-8])$/.exec(code);
    if (num) {
      selectHotbar(cur, Number(num[1]) - 1);
      bump();
    }
  };

  const worldOf = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const cam = camRef.current;
    return { x: (mx - cam.ox) / cam.scale, y: (my - cam.oy) / cam.scale };
  };

  const start = (fresh: boolean) => {
    try {
      armWind();
    } catch {
      /* A phone can refuse sound. The yard still opens. */
    }
    if (!ready) return;
    if (fresh) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(BAK1);
      localStorage.removeItem(BAK2);
      stateRef.current = createGame();
    } else if (!stateRef.current) stateRef.current = readSave() ?? createGame();
    screenRef.current = "play";
    panelRef.current = null;
    setScreen("play");
    setPanel(null);
    setWipe(false);
  };

  const prompt = (() => {
    if (!s || screen !== "play") return "";
    const h = hoverRef.current;
    if (h) {
      const text = promptAt(s, h.x, h.y);
      if (text) return text;
    }
    const face = facingPoint(s);
    return promptAt(s, face.x, face.y);
  })();

  const mass = s ? totalMass(s) : 0;
  const openPackItem = s?.pack.find((it) => it?.defId === "backpack") ?? s?.body.container ?? null;

  const slotMenu = (it: Item, x: number, y: number, from: "pack" | "inner", inner = 0) => {
    if (!s) return;
    const d = defOf(it);
    const rows: Menu["rows"] = [
      { label: "Examine", run: () => ((s.message = itemLabel(it)), bump()) },
    ];
    if (d.kind === "tool" || d.kind === "wear" || d.kind === "container") {
      rows.push({
        label: "Equip",
        run: () => {
          const slot = bestSlot(s, it.id);
          s.message = slot ? equipItem(s, it.id, slot) : `${d.name} cannot be worn.`;
          bump();
        },
      });
    }
    if (d.kind === "tool") {
      rows.push({
        label: "Activate",
        run: () => {
          s.activeId = it.id;
          const idx = s.hotbar.indexOf(it.id);
          if (idx >= 0) s.selected = idx;
          s.message = `Active: ${d.name}.`;
          bump();
        },
      });
      rows.push({
        label: "Draw into hand",
        run: () => {
          if (s.body.hands && s.body.hands.id !== it.id) {
            const prev = s.body.hands;
            s.body.hands = null;
            if (!giveItem(s, prev)) {
              s.body.hands = prev;
              const open = s.pack.some((p) => p === null);
              s.message = open
                ? "Burden limit exceeded. The hand stays as it is."
                : "Pack is full. Cannot swap the hand.";
              bump();
              return;
            }
          }
          const taken = takeItem(s, it.id);
          if (!taken) return;
          s.body.hands = taken;
          s.message = `Hand: ${d.name}.`;
          bump();
        },
      });
    }
    if (d.kind === "food" || d.kind === "product") {
      rows.push({
        label: "Eat",
        run: () => {
          s.hotbar[s.selected] = it.id;
          s.message = onQ(s);
          bump();
        },
      });
    }
    if (from === "pack" && it.defId !== "backpack" && openPackItem?.contents) {
      rows.push({
        label: "Stow in backpack",
        run: () => {
          const hole = openPackItem.contents!.findIndex((c) => c === null);
          const fromIdx = s.pack.findIndex((p) => p?.id === it.id);
          s.message = hole < 0 || fromIdx < 0 ? "The backpack is full." : moveToBackpack(s, fromIdx, hole);
          bump();
        },
      });
    }
    if (from === "inner") {
      rows.push({
        label: "Take out",
        run: () => {
          s.message = moveFromBackpack(s, inner);
          bump();
        },
      });
    }
    if (panel === "vault" && from === "pack") {
      rows.push({
        label: "Deposit",
        run: () => {
          s.message = deposit(s, it.id);
          persist(s);
          bump();
        },
      });
      rows.push({
        label: "Sell at Floor",
        run: () => {
          s.message = sellItem(s, it.id);
          persist(s);
          bump();
        },
      });
    }
    if (from === "pack") {
      rows.push({
        label: "Drop",
        run: () => {
          s.message = dropItem(s, it.id);
          bump();
        },
      });
    }
    setMenu({ x, y, rows });
  };

  const holdMenu = (e: ReactPointerEvent, run: () => void) => {
    if (e.pointerType === "mouse") return;
    const timer = window.setTimeout(() => {
      skipTap.current = true;
      run();
    }, 480);
    const clear = () => window.clearTimeout(timer);
    e.currentTarget.addEventListener("pointerup", clear, { once: true });
    e.currentTarget.addEventListener("pointercancel", clear, { once: true });
  };

  const handheld = touch || narrow;

  const refreshSprites = async (msg: string) => {
    const book = await loadDevSprites();
    setSprites(book);
    setEditStatus(msg);
  };
  editApi.current.commit = async (next, msg) => {
    histRef.current.push(devSpriteBook().placed.map((p) => ({ ...p })));
    if (histRef.current.length > 40) histRef.current.shift();
    redoRef.current = [];
    try {
      await replaceDevPlaced({ data: { placed: next } });
      await refreshSprites(msg);
    } catch {
      histRef.current.pop();
      setEditStatus("That edit did not save.");
    }
  };
  editApi.current.undo = () => {
    const prev = histRef.current.pop();
    if (!prev) {
      setEditStatus("Nothing to undo.");
      return;
    }
    redoRef.current.push(devSpriteBook().placed.map((p) => ({ ...p })));
    void replaceDevPlaced({ data: { placed: prev } }).then(() => refreshSprites("Undid the last edit."));
  };
  editApi.current.redo = () => {
    const next = redoRef.current.pop();
    if (!next) {
      setEditStatus("Nothing to redo.");
      return;
    }
    histRef.current.push(devSpriteBook().placed.map((p) => ({ ...p })));
    void replaceDevPlaced({ data: { placed: next } }).then(() => refreshSprites("Redid the edit."));
  };
  editApi.current.save = () => {
    flushTiles();
    void replaceDevPlaced({ data: { placed: devSpriteBook().placed } }).then(() => refreshSprites("Saved the stamps to the project."));
  };
  const onTool = (id: string) => {
    if (id === "undo") return editApi.current.undo();
    if (id === "redo") return editApi.current.redo();
    if (id === "save") return editApi.current.save();
    const all = devSpriteBook().placed.map((p) => ({ ...p }));
    const i = stampRef.current;
    if (i < 0 || !all[i]) {
      setEditStatus("Select a sprite first.");
      return;
    }
    const place = all[i];
    if (id === "copy") {
      const at = snapSprite(place.x + 8, place.y);
      void editApi.current.commit([...all, { ...place, x: at.x, y: at.y }], `Copied ${place.id}.`);
      return;
    }
    if (id === "flipx") all[i] = { ...place, flipX: !place.flipX };
    else if (id === "flipy") all[i] = { ...place, flipY: !place.flipY };
    else if (id === "turn") {
      const rot = (((place.rot ?? 0) + 90) % 360) as 0 | 90 | 180 | 270;
      all[i] = { ...place, rot };
    } else if (id === "front") {
      const [item] = all.splice(i, 1);
      all.push(item);
      stampRef.current = all.length - 1;
      setStampIx(all.length - 1);
      setSpritePick(all.length - 1);
    } else if (id === "back") {
      const [item] = all.splice(i, 1);
      all.unshift(item);
      stampRef.current = 0;
      setStampIx(0);
      setSpritePick(0);
    } else return;
    void editApi.current.commit(all, "Updated the sprite.");
  };
  const editPlaced = (change: (place: SpritePlace, all: SpritePlace[]) => void, msg: string) => {
    const all = devSpriteBook().placed.map((p) => ({ ...p }));
    const i = stampRef.current;
    if (i < 0 || !all[i]) {
      setEditStatus("Select a placed asset first.");
      return;
    }
    change(all[i], all);
    void editApi.current.commit(all, msg);
  };
  const onArmAsset = (id: string, w: number, h: number) => {
    const file = assetFile(id);
    if (!file) {
      setEditStatus("That asset is missing.");
      return;
    }
    setEditStatus(`Loading ${id}…`);
    pinDevAsset({ data: { id, file, w, h } })
      .then(() => loadDevSprites())
      .then((book) => {
        setSprites(book);
        armedRef.current = id;
        setArmed(id);
        editorRef.current.mode = "sprite";
        setEditMode("sprite");
        setEditStatus(`${id} is ready. Click the yard to place it.`);
      })
      .catch(() => setEditStatus("That asset did not load."));
  };
  const onScale = (dir: 1 | -1) => {
    editPlaced((place) => {
      const cur = SCALES.indexOf((place.scale ?? 1) as (typeof SCALES)[number]);
      const next = SCALES[Math.max(0, Math.min(SCALES.length - 1, (cur < 0 ? 2 : cur) + dir))];
      place.scale = next;
    }, dir > 0 ? "Made it bigger." : "Made it smaller.");
  };
  const onRole = () => {
    const order = ["decor", "solid", "use"] as const;
    editPlaced((place) => {
      const cur = order.indexOf(place.role === "solid" || place.role === "use" ? place.role : "decor");
      place.role = order[(cur + 1) % order.length];
    }, "Changed what the asset does.");
  };
  const onReplace = () => {
    const id = armedRef.current;
    if (!id) {
      setEditStatus("Pick the asset that should replace this one.");
      return;
    }
    editPlaced((place) => {
      place.id = id;
    }, `Replaced it with ${id}.`);
  };
  const onAssetNote = (text: string) => {
    editPlaced((place) => {
      place.note = text.slice(0, 140);
    }, "Saved what it does.");
  };
  const onPickPlaced = (i: number) => {
    const place = devSpriteBook().placed[i];
    if (!place) return;
    const def = devSpriteBook().library.find((d) => d.id === place.id);
    stampRef.current = i;
    setStampIx(i);
    setSpritePick(i);
    setEditSel(placeBounds(place, def));
    setEditStatus(`Selected ${place.id}.`);
  };

  return (
    <main className={`${handheld ? "assay touch" : "assay"}${editorOpen && devHere ? " dev-open" : ""}`}>
      <div className="yard-stage">
      <canvas
        ref={canvasRef}
        aria-label="Assay Homestead yard"
        onContextMenu={(e) => e.preventDefault()}
        onPointerMove={(e) => {
          const w = worldOf(e.clientX, e.clientY);
          hoverRef.current = w;
          const ed = editorRef.current;
          if (!ed.open || !w) return;
          if (ed.mode === "move" && ed.sprite) {
            const at = snapSprite(w.x - ed.sprite.ox, w.y - ed.sprite.oy);
            setSpriteGhost({ index: ed.sprite.index, x: at.x, y: at.y });
            return;
          }
          if (!ed.drag) return;
          if (ed.mode === "rect") ed.live = snapRect(ed.drag, w);
          else if (ed.mode === "tile" || ed.mode === "cell" || ed.mode === "row" || ed.mode === "column") {
            ed.live = pickRect(ed.mode, w);
          }
        }}
        onPointerLeave={() => {
          hoverRef.current = null;
        }}
        onPointerDown={(e) => {
          if (screenRef.current !== "play") return;
          try {
            armWind();
          } catch {
            /* sound can stay off */
          }
          const w = worldOf(e.clientX, e.clientY);
          if (!w) return;
          const ed = editorRef.current;
          if (ed.open) {
            e.preventDefault();
            if (ed.mode === "rect") {
              ed.drag = w;
              ed.live = snapRect(w, w);
            } else if (ed.mode === "tile" || ed.mode === "cell" || ed.mode === "row" || ed.mode === "column") {
              const box = pickRect(ed.mode, w);
              ed.sel = box;
              ed.live = box;
              setEditSel(box);
            } else if (ed.mode === "sprite") {
              const id = armedRef.current;
              if (!id) {
                setEditStatus("Attach a sprite, then click the grid.");
                return;
              }
              const at = snapSprite(w.x, w.y);
              const def = devSpriteBook().library.find((d) => d.id === id);
              const scale = def ? fitScale(def.w, def.h) : 1;
              const next = [...devSpriteBook().placed.map((p) => ({ ...p })), { id, x: at.x, y: at.y, rot: 0 as const, scale, role: "decor" as const, note: "" }];
              void editApi.current.commit(next, `Stamped ${id} on the grid at ${at.x}, ${at.y}.`).then(() => {
                const i = devSpriteBook().placed.length - 1;
                stampRef.current = i;
                setStampIx(i);
                setSpritePick(i);
                if (def) setEditSel(placeBounds({ id, x: at.x, y: at.y, scale }, def));
              });
            } else if (ed.mode === "select" || ed.mode === "erase" || ed.mode === "move") {
              const i = spriteIndexAt(w.x, w.y);
              if (i < 0) {
                setEditStatus(ed.mode === "erase" ? "No sprite there to erase." : "No sprite there.");
                return;
              }
              const place = devSpriteBook().placed[i];
              const def = devSpriteBook().library.find((d) => d.id === place.id);
              const box = placeBounds(place, def);
              if (ed.mode === "erase") {
                stampRef.current = -1;
                setStampIx(-1);
                setSpritePick(-1);
                void editApi.current.commit(
                  devSpriteBook().placed.filter((_, n) => n !== i).map((p) => ({ ...p })),
                  `Erased ${place.id}.`,
                );
                return;
              }
              stampRef.current = i;
              setStampIx(i);
              setSpritePick(i);
              setEditSel(box);
              if (ed.mode === "move") {
                ed.drag = w;
                ed.sprite = { index: i, ox: w.x - place.x, oy: w.y - place.y };
                setEditStatus(`Moving ${place.id}.`);
                return;
              }
              setEditStatus(`Selected ${place.id}.`);
            }
            return;
          }
          if (e.button === 2) {
            const cur = stateRef.current;
            if (!cur) return;
            cur.message = examineAt(cur, w.x, w.y);
            setMenu({
              x: e.clientX,
              y: e.clientY,
              rows: [
                { label: promptAt(cur, w.x, w.y).replace("  [E]", "") || "Use", run: () => useAt(w.x, w.y) },
                { label: "Examine", run: () => bump() },
              ],
            });
            bump();
            return;
          }
          if (e.pointerType === "touch" || e.pointerType === "pen") {
            const timer = window.setTimeout(() => {
              const cur = stateRef.current;
              if (!cur || screenRef.current !== "play") return;
              cur.message = examineAt(cur, w.x, w.y);
              setMenu({
                x: e.clientX,
                y: e.clientY,
                rows: [
                  { label: promptAt(cur, w.x, w.y).replace("  [E]", "") || "Use", run: () => useAt(w.x, w.y) },
                  { label: "Examine", run: () => bump() },
                ],
              });
              bump();
              (e.currentTarget as HTMLElement).dataset.held = "1";
            }, 460);
            (e.currentTarget as HTMLElement).dataset.hold = String(timer);
            (e.currentTarget as HTMLElement).dataset.held = "";
            return;
          }
          if (e.button === 0) useAt(w.x, w.y);
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLElement;
          const timer = Number(el.dataset.hold || 0);
          if (timer) window.clearTimeout(timer);
          el.dataset.hold = "";
          const ed = editorRef.current;
          if (ed.open && ed.drag) {
            const w = worldOf(e.clientX, e.clientY) ?? ed.drag;
            if (ed.mode === "move" && ed.sprite) {
              const drag = ed.sprite;
              ed.sprite = null;
              ed.drag = null;
              setSpriteGhost(null);
              const at = snapSprite(w.x - drag.ox, w.y - drag.oy);
              const next = devSpriteBook().placed.map((p, i) => (i === drag.index ? { ...p, x: at.x, y: at.y } : { ...p }));
              void editApi.current.commit(next, `Moved to ${at.x}, ${at.y}.`);
              return;
            }
            if (ed.mode === "rect") {
              const box = snapRect(ed.drag, w);
              ed.sel = box;
              ed.live = null;
              setEditSel(box);
            } else if (ed.mode === "tile" || ed.mode === "cell" || ed.mode === "row" || ed.mode === "column") {
              const box = pickRect(ed.mode, w);
              ed.sel = box;
              ed.live = null;
              setEditSel(box);
            }
            ed.drag = null;
            return;
          }
          if (el.dataset.held === "1") {
            el.dataset.held = "";
            return;
          }
          if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
          if (screenRef.current !== "play" || editorRef.current.open) return;
          const w = worldOf(e.clientX, e.clientY);
          if (w) useAt(w.x, w.y);
        }}
      />

      {screen === "play" && s && (
        <>
          <div className="hud-top">
            <div className="hud-row">
              <div className="panel hud-card">
                <div className="hud-head">
                  <b>Body</b>
                  <span>Day {s.day}</span>
                </div>
                <Vital
                  label="Health"
                  value={String(Math.round(s.health ?? 100))}
                  pct={s.health ?? 100}
                  color={(s.health ?? 100) < 30 ? "#e07a5f" : "#c4544a"}
                />
                <Vital label="Stamina" value={String(Math.round(s.stamina))} pct={s.stamina} color={s.stamina < 20 ? "#e07a5f" : "#7dba5a"} />
                <Vital
                  label="Mana"
                  value={String(Math.round(s.mana ?? 100))}
                  pct={s.mana ?? 100}
                  color={(s.mana ?? 100) < 20 ? "#c47ad4" : "#6aa7e8"}
                />
                <Vital label="Carry" value={mass.toFixed(1)} pct={(mass / MASS_CAP) * 100} color={mass >= 16 ? "#e07a5f" : "#c4a574"} />
                <div className="need-row">
                  <Need label="Hunger" value={s.life?.hunger ?? 0} />
                  <Need label="Thirst" value={s.life?.thirst ?? 0} />
                  <Need label="Grime" value={s.life?.dirt ?? 0} />
                </div>
                <Vital
                  label="Mood"
                  value={String(Math.round(s.life?.mood ?? 0))}
                  pct={s.life?.mood ?? 0}
                  color={(s.life?.mood ?? 0) < 40 ? "#e07a5f" : "#e2b657"}
                />
              </div>
              <div className="panel hud-crest">
                <b>{s.wing === 1 ? "Svarga" : s.wing === -1 ? "Naraka" : "Homestead"}</b>
                <span>{placeName(s)}</span>
                <span>
                  {clockLabel(s.time)} · {skyLabel(s)}
                </span>
                <span className="hud-sub">{s.cast ? liturgyName(s.cast.spell, s.wing ?? 0) : s.downed ? "Downed" : "Clear"}</span>
              </div>
              <div className="panel hud-card">
                <div className="hud-head">
                  <b>Hands</b>
                  <span>Purse {coinCount(s)}</span>
                </div>
                <div className="fn-grid">
                  <button type="button" className={panel === "pack" ? "on" : ""} onClick={() => toggle("pack")}>
                    Pack
                  </button>
                  <button type="button" className={panel === "body" ? "on" : ""} onClick={() => toggle("body")}>
                    Body
                  </button>
                  <button type="button" className={panel === "skills" ? "on" : ""} onClick={() => toggle("skills")}>
                    Skills
                  </button>
                  <button type="button" className={panel === "map" ? "on" : ""} onClick={() => toggle("map")}>
                    Map
                  </button>
                  <button
                    type="button"
                    className={panel === "vault" ? "on" : ""}
                    onClick={() => {
                      if (Math.hypot(s.x - 260, s.y - 146) > 40) {
                        s.message = "Stand at the house.";
                        bump();
                        return;
                      }
                      toggle("vault");
                    }}
                  >
                    Chest
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      s.message = onQ(s);
                      bump();
                    }}
                  >
                    Eat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      s.message = onF(s);
                      bump();
                    }}
                  >
                    Stow
                  </button>
                  <button
                    type="button"
                    className={running ? "on" : ""}
                    onClick={() => {
                      runHold.current = !runHold.current;
                      setRunning(runHold.current);
                      const cur = stateRef.current;
                      if (cur) cur.message = runHold.current ? "Run is on. He moves faster." : "Run is off. He walks.";
                      bump();
                    }}
                  >
                    Run
                  </button>
                </div>
                <button
                  type="button"
                  className={`hud-wide${s.auto === false ? "" : " on"}`}
                  onClick={() => {
                    s.auto = s.auto === false;
                    if (!s.auto) {
                      s.life.errand = null;
                      s.life.route = [];
                      s.life.chore = "";
                      s.cast = null;
                    }
                    s.message = s.auto ? "Autonomy on. He tends the farm." : "Autonomy off. He waits for you.";
                    persist(s);
                    bump();
                  }}
                >
                  {s.auto === false ? "Autonomy off" : "Autonomy on"}
                </button>
                <button type="button" className={`hud-wide${panel === "pause" ? " on" : ""}`} onClick={() => toggle("pause")}>
                  Pause
                </button>
              </div>
            </div>
            <div className="panel hud-band">
              <SoundControls />
            </div>
          </div>
          <div className="hotbar-wrap">
            {handheld ? (
              <div className="prompt">
                {s.message || prompt || (s.downed ? "Downed. Crawl to the tub." : "Walk the yard.")}
              </div>
            ) : (
              <>
                {s.message && (
                  <div className="prompt" style={{ maxWidth: "100%" }}>
                    {s.message.startsWith("Tomato, cauliflower")
                      ? s.wing === 1
                        ? "Amarāvatī. The light here is leased."
                        : s.wing === -1
                          ? "The river is the Vaitaraṇī. The sentence is not eternal."
                          : s.message
                      : s.message}
                  </div>
                )}
                <div className="prompt">{prompt || (s.downed ? "Downed — crawl to the bathtub  [E]" : " ")}</div>
              </>
            )}
            <div className="hotbar" role="toolbar" aria-label="Hotbar">
              {s.hotbar.map((id, i) => {
                const it = findItem(s, id);
                const d = it ? defOf(it) : null;
                return (
                  <button
                    key={i}
                    className={`slot${s.selected === i ? " sel" : ""}${it && s.activeId === it.id ? " on" : ""}`}
                    onClick={() => {
                      if (s.selected === i) s.message = onQ(s);
                      else selectHotbar(s, i);
                      bump();
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = e.dataTransfer.getData("text/plain");
                      if (!data.startsWith("pack:")) return;
                      const it2 = s.pack[Number(data.slice(5))];
                      if (it2) assignHotbar(s, i, it2.id);
                      bump();
                    }}
                    aria-label={d ? d.name : `Empty slot ${i + 1}`}
                  >
                    <span className="idx">{i + 1}</span>
                    {it && d && <Icon icon={d.icon} size={handheld ? 18 : 30} />}
                    {it && d?.kind === "tool" && <span className="floor">{Math.round(it.floor)}</span>}
                    {it && defOf(it).stack && it.qty > 1 && <span className="qty">{it.qty}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      </div>

      {screen === "play" && devHere && (
        <MapEditor
          open={editorOpen}
          onToggle={() => {
            setEditorOpen((v) => !v);
            setEditStatus("");
          }}
          sel={editSel}
          note={editNote}
          setNote={(v) => {
            setEditNote(v);
            setDraft("");
          }}
          mode={editMode}
          setMode={(mode) => {
            editorRef.current.mode = mode;
            setEditMode(mode);
            const cur = stateRef.current;
            if (mode === "yard") setEditSel({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
            else if (mode === "meadow") setEditSel({ x: MEADOW.x, y: MEADOW.y, w: MEADOW.w, h: MEADOW.h });
            else if (mode === "world") setEditSel({ x: 0, y: 0, w: WORLD_W, h: WORLD_H });
            else if (mode === "here" && cur) {
              const x = Math.max(0, Math.min(WORLD_W - 32, Math.floor((cur.x - 16) / 8) * 8));
              const y = Math.max(0, Math.min(WORLD_H - 32, Math.floor((cur.y - 16) / 8) * 8));
              setEditSel({ x, y, w: 32, h: 32 });
            }
          }}
          preview={canvasRef}
          cameraRef={camRef}
          sprites={sprites.library}
          rev={sprites.rev}
          armed={armed}
          onArm={(id) => {
            armedRef.current = id;
            setArmed(id);
            editorRef.current.mode = "sprite";
            setEditMode("sprite");
            setEditStatus("Click the yard. The sprite snaps to the 8px grid.");
          }}
          onUpload={(file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const data = String(reader.result || "");
                const b64 = data.slice(data.indexOf(",") + 1);
                saveDevSprite({ data: { name: file.name, mime: file.type, b64, w: img.width, h: img.height } })
                  .then((def) => {
                    armedRef.current = def.id;
                    setArmed(def.id);
                    editorRef.current.mode = "sprite";
                    setEditMode("sprite");
                    return loadDevSprites();
                  })
                  .then((book) => {
                    setSprites(book);
                    setEditStatus("Attached. Click the yard to stamp it on the grid.");
                  })
                  .catch(() => setEditStatus("That sprite did not attach."));
              };
              img.src = String(reader.result || "");
            };
            reader.readAsDataURL(file);
          }}
          onLift={() => {
            const box = editSel ?? { x: 0, y: 0, w: 32, h: 32 };
            if (!editSel) {
              setEditStatus("Select the sprite, then Lift.");
              return;
            }
            const before = devSpriteBook().placed.map((p) => ({ ...p }));
            liftDevSprite({ data: { x: box.x, y: box.y, w: box.w, h: box.h } })
              .then((res) => {
                if (!res.lifted) {
                  setEditStatus("No sprite in that selection.");
                  return;
                }
                histRef.current.push(before);
                redoRef.current = [];
                stampRef.current = -1;
                setStampIx(-1);
                setSpritePick(-1);
                return refreshSprites("Lifted sprites inside the selection.");
              })
              .catch(() => setEditStatus("Nothing lifted."));
          }}
          onTool={onTool}
          placed={sprites.placed}
          picked={stampIx}
          onArmAsset={onArmAsset}
          onPickPlaced={onPickPlaced}
          onScale={onScale}
          onRole={onRole}
          onReplace={onReplace}
          onNote={onAssetNote}
          onBlock={(blocked) => {
            if (!editSel) {
              setEditStatus("Select a place on the yard first.");
              return;
            }
            blockRect(editSel, blocked);
            setEditStatus(blocked ? "That square blocks walking." : "That square is open to walk.");
          }}
          onSend={() => {
            if (!editSel || !editNote.trim()) {
              setEditStatus(editSel ? "Write what you want, then press Write prompt." : "Drag a rectangle, then write what you want.");
              return;
            }
            const cur = stateRef.current;
            const order = editorOrder(editSel, editNote.trim(), {
              x: cur?.x,
              y: cur?.y,
              wing: cur?.wing,
              weather: cur?.weather,
            });
            setDraft(order);
            setEditStatus(copyText(order) ? "Work order copied. Paste it into the chat." : "Work order is ready. Press Copy.");
          }}
          onCopy={() => {
            if (!draft) {
              setEditStatus("Write the prompt first.");
              return;
            }
            setEditStatus(copyText(draft) ? "Copied. Paste it into the chat." : "Select the prompt and copy it by hand.");
          }}
          status={editStatus}
          draft={draft}
          busy={false}
        />
      )}

      {handheld && screen === "play" && (
        <>
          <div className="touch-actions" role="toolbar" aria-label="Actions">
            <button type="button" onClick={() => toggle("pack")}>Pack</button>
            <button type="button" onClick={() => toggle("body")}>Body</button>
            <button
              type="button"
              onClick={() => {
                const cur = stateRef.current;
                if (!cur) return;
                if (Math.hypot(cur.x - 260, cur.y - 146) > 40) {
                  cur.message = "Stand at the house.";
                  bump();
                  return;
                }
                toggle("vault");
              }}
            >
              Chest
            </button>
            <button type="button" onClick={() => toggle("map")}>Map</button>
            <button
              type="button"
              onClick={() => {
                const cur = stateRef.current;
                if (!cur) return;
                cur.message = onQ(cur);
                bump();
              }}
            >
              Eat
            </button>
            <button
              type="button"
              onClick={() => {
                const cur = stateRef.current;
                if (!cur) return;
                cur.message = onF(cur);
                bump();
              }}
            >
              Stow
            </button>
            <button
              type="button"
              className={running ? "on" : ""}
              onClick={() => {
                runHold.current = !runHold.current;
                setRunning(runHold.current);
                const cur = stateRef.current;
                if (cur) cur.message = runHold.current ? "Run is on. He moves faster." : "Run is off. He walks.";
                bump();
              }}
            >
              Run
            </button>
            <button type="button" onClick={() => toggle("pause")}>Pause</button>
          </div>
          <div
            className="stick"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              stickRef.current = { x: 0, y: 0 };
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0) return;
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
              const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
              const m = Math.hypot(x, y) || 1;
              stickRef.current = { x: x / m, y: y / m };
              const knob = (e.currentTarget as HTMLElement).querySelector("i");
              if (knob) knob.style.transform = `translate(${(x / m) * 28}px, ${(y / m) * 28}px)`;
            }}
            onPointerUp={(e) => {
              stickRef.current = { x: 0, y: 0 };
              const knob = (e.currentTarget as HTMLElement).querySelector("i");
              if (knob) knob.style.transform = "translate(0px, 0px)";
            }}
          >
            <i style={{ transform: `translate(${stickRef.current.x * 28}px, ${stickRef.current.y * 28}px)` }} />
          </div>
          <button
            className="use-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const cur = stateRef.current;
              if (!cur) return;
              const p = facingPoint(cur);
              useAt(p.x, p.y);
            }}
          >
            E
          </button>
        </>
      )}

      {screen === "title" && (
        <div className="overlay">
          <div className="panel sheet" style={{ maxWidth: 560 }}>
            <p style={{ margin: 0, letterSpacing: "0.18em", fontSize: 12 }}>ONE YARD</p>
            <h1 className="title-mark">XDruid I</h1>
            <p style={{ marginTop: 0 }}>
              A fenced spring yard. Twenty-eight slots, a pack that gets heavy, and tools that spend their Floor when you use them.
            </p>
            {err && <p>{err}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="slot" style={{ width: "auto", padding: "12px 18px" }} disabled={!ready} onClick={() => start(false)}>
                {ready ? "Play" : "Loading yard…"}
              </button>
              <button className="slot" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setPanel(panel === "controls" ? null : "controls")}>
                Options
              </button>
              <SoundControls />
            </div>
          </div>
        </div>
      )}

      {panel === "controls" && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className="panel sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h2>Options</h2>
            <SoundControls />
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13 }}>{CONTROLS}</pre>
            <p style={{ fontSize: 12 }}>
              Art: Farm Life by sophi-x-x. Animals: Farmstead 01 Byre and Barn. Food and crops: Farm to Table. Used inside this game only, not redistributed as a pack.
            </p>
            <button className="slot" style={{ width: "auto", padding: "6px 10px" }} onClick={() => setPanel(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {screen === "play" && s && (panel === "pack" || panel === "vault" || panel === "backpack" || panel === "body") && (
        <div className="overlay">
          <div className="panel sheet inv">
            <h2>{panel === "vault" ? "House stores" : panel === "body" ? "Body" : "Pack"}</h2>
            <p style={{ marginTop: 0, fontSize: 13 }}>
              {panel === "body"
                ? `Health ${Math.round(s.health ?? 100)} · Stamina ${Math.round(s.stamina)} · Mana ${Math.round(s.mana ?? 100)}. The pack is its own page.`
                : `${s.pack.filter(Boolean).length}/28 slots · ${mass.toFixed(1)} / ${MASS_CAP.toFixed(1)} · Floor purse ${coinCount(s)}`}
              {panel === "vault" ? " · Click a pack item, then a chest slot, to store it." : panel === "body" ? " Choose a piece in the Pack, then click a slot here." : " Choose a piece, then open Body to wear it."}
            </p>
            {picked && findItem(s, picked) && (
              <p style={{ fontSize: 13, marginTop: 0 }}>
                {defOf(findItem(s, picked)!).name}.{" "}
                {bestSlot(s, picked) ? (
                  <button
                    type="button"
                    className="slot"
                    style={{ width: "auto", padding: "4px 8px" }}
                    onClick={() => {
                      const slot = bestSlot(s, picked);
                      if (!slot) return;
                      s.message = equipItem(s, picked, slot);
                      setPicked(null);
                      bump();
                    }}
                  >
                    Equip
                  </button>
                ) : (
                  "This cannot be worn."
                )}
              </p>
            )}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {panel !== "body" && (
              <div>
                <div className="inv-grid">
                  {s.pack.map((it, i) => (
                    <button
                      key={i}
                      className={`inv-slot${it && picked === it.id ? " pick" : ""}${it && s.activeId === it.id ? " worn" : ""}`}
                      draggable={!!it}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", `pack:${i}`)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text/plain");
                        if (data.startsWith("pack:")) swapPack(s, Number(data.slice(5)), i);
                        else if (data.startsWith("body:") && !it) {
                          s.message = unequipItem(s, data.slice(5) as EquipSlot);
                        }
                        bump();
                      }}
                      onPointerDown={(e) => it && holdMenu(e, () => slotMenu(it, e.clientX, e.clientY, "pack"))}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (it) slotMenu(it, e.clientX, e.clientY, "pack");
                      }}
                      onClick={() => {
                        if (skipTap.current) {
                          skipTap.current = false;
                          return;
                        }
                        if (!it) {
                          setPicked(null);
                          return;
                        }
                        if (picked === it.id && it.defId === "backpack") {
                          panelRef.current = "backpack";
                          setPanel("backpack");
                          return;
                        }
                        setPicked(picked === it.id ? null : it.id);
                      }}
                      aria-label={it ? defOf(it).name : "Empty pack slot"}
                    >
                      {it && <Icon icon={defOf(it).icon} size={28} />}
                      {it && defOf(it).stack && it.qty > 1 && <span className="qty">{it.qty}</span>}
                    </button>
                  ))}
                </div>
                {openPackItem?.contents && (panel === "backpack" || panel === "pack") && (
                  <>
                    <h2 style={{ fontSize: 14 }}>Field backpack</h2>
                    <div className="hotbar">
                      {openPackItem.contents.map((it, i) => (
                        <button
                          key={i}
                          className="slot"
                          onPointerDown={(e) => it && holdMenu(e, () => slotMenu(it, e.clientX, e.clientY, "inner", i))}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (it) slotMenu(it, e.clientX, e.clientY, "inner", i);
                          }}
                          onClick={() => {
                            if (skipTap.current) {
                              skipTap.current = false;
                              return;
                            }
                            if (it) {
                              s.message = moveFromBackpack(s, i);
                              bump();
                            }
                          }}
                        >
                          {it && <Icon icon={defOf(it).icon} size={26} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              )}
              {panel === "body" && (
              <div>
                <h2 style={{ fontSize: 14, marginTop: 0 }}>Worn</h2>
                <div className="doll">
                  {(
                    [
                      ["amulet", "Amulet"],
                      ["head", "Head"],
                      ["ring", "Ring"],
                      ["hands", "Hands"],
                      ["torso", "Torso"],
                      ["offhand", "Off hand"],
                      ["feet", "Feet"],
                      ["legs", "Legs"],
                      ["belt", "Belt"],
                      ["container", "Bag"],
                    ] as const
                  ).map(([slot, label]) => {
                    const worn = s.body[slot];
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`inv-slot${worn ? " worn" : ""}`}
                        style={{ gridArea: slot }}
                        draggable={!!worn}
                        onDragStart={(e) => worn && e.dataTransfer.setData("text/plain", `body:${slot}`)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const data = e.dataTransfer.getData("text/plain");
                          if (!data.startsWith("pack:")) return;
                          const it = s.pack[Number(data.slice(5))];
                          if (!it) return;
                          s.message = equipItem(s, it.id, slot);
                          setPicked(null);
                          bump();
                        }}
                        onClick={() => {
                          if (picked) {
                            s.message = equipItem(s, picked, slot);
                            setPicked(null);
                            bump();
                            return;
                          }
                          if (worn) {
                            s.message = unequipItem(s, slot);
                            bump();
                          }
                        }}
                        aria-label={worn ? `${label}: ${defOf(worn).name}` : `${label} empty`}
                      >
                        {worn && <Icon icon={defOf(worn).icon} size={26} />}
                        <em>{label}</em>
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, maxWidth: 280 }}>Click a worn slot to stow it. Tools go on the hands. Clothes go on their own slot.</p>
              </div>
              )}
              {panel === "vault" && (
                <div>
                  <div className="inv-grid" style={{ gridTemplateColumns: "repeat(8, 56px)" }}>
                    {s.vault.map((it, i) => (
                      <button
                        key={i}
                        className={`inv-slot${vaultSel === i ? " pick" : ""}`}
                        onClick={() => {
                          setVaultSel(i);
                          if (picked && s.pack.some((p) => p?.id === picked)) {
                            s.message = deposit(s, picked);
                            setPicked(null);
                            persist(s);
                            bump();
                          }
                        }}
                      >
                        {it && <Icon icon={defOf(it).icon} size={26} />}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <button className="slot" style={{ width: "auto", padding: "6px 8px" }} onClick={() => { s.message = withdraw(s, vaultSel, false); persist(s); bump(); }}>
                      Withdraw
                    </button>
                    <button className="slot" style={{ width: "auto", padding: "6px 8px" }} onClick={() => { s.message = withdraw(s, vaultSel, true); persist(s); bump(); }}>
                      Withdraw as note
                    </button>
                    <button className="slot" style={{ width: "auto", padding: "6px 8px" }} onClick={() => { s.message = buyFineCan(s); persist(s); bump(); }}>
                      Buy fine can · 48
                    </button>
                  </div>
                  <p style={{ fontSize: 13 }}>{s.stats.boughtTool ? "The fine can is already yours." : "Ledger price is Floor. A buyer in town is not on this yard."}</p>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13 }}>{s.message}</p>
            <button className="slot" style={{ width: "auto", padding: "6px 10px" }} onClick={() => { panelRef.current = null; setPanel(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {screen === "play" && s && panel === "skills" && (
        <div className="overlay" onClick={() => { panelRef.current = null; setPanel(null); }}>
          <div className="panel sheet skills-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Skills</h2>
            <p style={{ marginTop: 0, fontSize: 13 }}>
              Health {Math.round(s.health ?? 100)}. He learns by doing the work. The pack and the body stay on their own pages.
            </p>
            <div className="skill-list">
              {SKILL_IDS.map((id) => {
                const xp = s.skills?.[id] ?? 0;
                const level = skillLevel(xp);
                return (
                  <div className="skill-row" key={id}>
                    <b>{SKILL_NAME[id]}</b>
                    <i>Lv {level}</i>
                    <div className="meter">
                      <span style={{ width: `${skillFill(xp) * 100}%`, background: "#c4a574" }} />
                    </div>
                    <small>{SKILL_NOTE[id]}</small>
                  </div>
                );
              })}
            </div>
            <button className="slot" style={{ width: "auto", padding: "6px 10px", marginTop: 10 }} onClick={() => { panelRef.current = null; setPanel(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {screen === "play" && s && panel === "craft" && (
        <div className="overlay">
          <div className="panel sheet" style={{ maxWidth: 480 }}>
            <h2>Workbench</h2>
            <p style={{ fontSize: 13 }}>
              Quality {Math.round(s.structures.find((st) => st.id === "bench")?.quality ?? 0)} · Floor{" "}
              {s.structures.find((st) => st.id === "bench")?.floor.toFixed(1)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="slot" style={{ width: "auto", padding: "8px 10px" }} onClick={() => { s.message = craftKit(s); bump(); }}>
                Repair kit · 2 branches
              </button>
              <button className="slot" style={{ width: "auto", padding: "8px 10px" }} onClick={() => { s.message = craftRepairTool(s); bump(); }}>
                Restore active tool Floor · 1 kit
              </button>
              <button className="slot" style={{ width: "auto", padding: "8px 10px" }} onClick={() => { s.message = craftSeeds(s); persist(s); bump(); }}>
                Tomato seeds ×2 · 4 Floor
              </button>
            </div>
            <p style={{ fontSize: 13 }}>{s.message}</p>
            <button className="slot" style={{ width: "auto", padding: "6px 10px" }} onClick={() => { panelRef.current = null; setPanel(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {screen === "play" && s && panel === "map" && (
        <div className="overlay" onClick={() => { panelRef.current = null; setPanel(null); }}>
          <div className="panel sheet map-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{s.wing === 1 ? "Svarga" : s.wing === -1 ? "Naraka" : "Homestead"}</h2>
            <p className="map-now">You are at {placeName(s)}.</p>
            <div
              className="live-map"
              style={{ aspectRatio: s.wing ? "347 / 960" : "347 / 528" }}
            >
              {s.wing ? (
                <img
                  src={s.wing === 1 ? `/game/land/svarga.png?v=${ART}` : `/game/land/naraka.png?v=${ART}`}
                  alt={s.wing === 1 ? "Svarga" : "Naraka"}
                />
              ) : (
                <>
                  <img src={`/game/yard.png?v=${ART}`} alt="The farm" className="live-map-farm" />
                  <div className="live-map-walk" />
                  <div className="live-map-court" />
                </>
              )}
              {(s.wing === 0 || s.wing == null) && (
                <>
                  <span className="pin naraka" style={{ left: `${(40 / WORLD_W) * 100}%`, top: `${(210 / 528) * 100}%` }}>Naraka</span>
                  <span className="pin svarga" style={{ left: `${(308 / WORLD_W) * 100}%`, top: `${(210 / 528) * 100}%` }}>Svarga</span>
                  <span className="pin seal" style={{ left: `${(172 / WORLD_W) * 100}%`, top: `${(380 / 528) * 100}%` }}>Magic</span>
                  <span className="pin spot" style={{ left: `${(134 / WORLD_W) * 100}%`, top: `${(88 / 528) * 100}%` }}>Pond</span>
                  <span className="pin spot" style={{ left: `${(260 / WORLD_W) * 100}%`, top: `${(146 / 528) * 100}%` }}>House</span>
                  <span className="pin spot" style={{ left: `${(268 / WORLD_W) * 100}%`, top: `${(92 / 528) * 100}%` }}>Goat</span>
                  <span className="pin spot" style={{ left: `${(220 / WORLD_W) * 100}%`, top: `${(212 / 528) * 100}%` }}>Xiang Su</span>
                  {s.cat && (
                    <span className="pin spot" style={{ left: `${(s.cat.x / WORLD_W) * 100}%`, top: `${(s.cat.y / 528) * 100}%` }}>Cat</span>
                  )}
                  {s.hand && (
                    <span className="pin spot" style={{ left: `${(s.hand.x / WORLD_W) * 100}%`, top: `${(s.hand.y / 528) * 100}%` }}>Hand</span>
                  )}
                </>
              )}
              {s.wing === 1 && (
                <span className="pin svarga" style={{ left: `${(40 / WORLD_W) * 100}%`, top: `${(210 / WORLD_H) * 100}%` }}>Yard</span>
              )}
              {s.wing === -1 && (
                <span className="pin naraka" style={{ left: `${(308 / WORLD_W) * 100}%`, top: `${(210 / WORLD_H) * 100}%` }}>Yard</span>
              )}
              <span
                className="pin you"
                style={{
                  left: `${(s.x / WORLD_W) * 100}%`,
                  top: `${(s.y / (s.wing ? WORLD_H : 528)) * 100}%`,
                }}
              >
                You
              </span>
            </div>
            <ul>
              {(s.wing === 0 || s.wing == null) && (
                <>
                  <li>West arch is Naraka. East arch is Svarga. Both stand on the sidewalk.</li>
                  <li>The farm is above the sidewalk. The goat pen is the upper-right fence. The pond and the house are on the farm.</li>
                  <li>Xiang Su stands on the sidewalk. The cat walks the sidewalk and the courtyard.</li>
                  <li>The seal in the courtyard is the magic plot. The field hand works the beds.</li>
                </>
              )}
              {s.wing === 1 && (
                <>
                  <li>The gate on the left of Svarga returns to the yard.</li>
                  <li>Under the cliff is the home land, seen from heaven. The house, the pond lotus, the fields, and the seal mark it. A shaft of light falls from Svarga onto that seal.</li>
                </>
              )}
              {s.wing === -1 && (
                <>
                  <li>The gate on the right of Naraka returns to the yard.</li>
                  <li>Under the cliff is the ash court. The fire channel and the two posts mark it.</li>
                </>
              )}
            </ul>
            <button className="slot" style={{ width: "auto", padding: "6px 10px" }} onClick={() => { panelRef.current = null; setPanel(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {screen === "play" && s && (panel === "pause" || panel === "summary") && (
        <div className="overlay">
          <div className="panel sheet" style={{ maxWidth: 520 }}>
            <h2>{panel === "summary" ? `Day 14 done` : "Pause"}</h2>
            <ul style={{ fontSize: 14 }}>
              <li>Days slept: {s.stats.daysSlept} / 14</li>
              <li>Beds still alive: {bedsAlive(s)} / 4</li>
              <li>Gate repaired: {s.stats.gateRepaired ? "yes" : "not yet"}</li>
              <li>Meals cooked: {s.stats.cooked}</li>
              <li>Floor earned: {s.stats.floorEarned}</li>
              <li>Fine can: {s.stats.boughtTool ? "bought" : "still on the ledger"}</li>
              <li>Harvests: {s.stats.harvested}</li>
              <li>{isNight(s.time) ? "Night. The tub or the shed will pass the day." : "Daylight. Water what you mean to keep."}</li>
            </ul>
            {panel === "pause" && (
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12 }}>{CONTROLS}</pre>
            )}
            <details style={{ fontSize: 13, margin: "8px 0" }}>
              <summary>Legal and security</summary>
              <p>XDruid I is a game. Play it in a browser on a phone or a computer. Do not open the files as an app.</p>
              <p>The yard is saved in this browser only. There is no account required to play, and the save is not sent to a server.</p>
              <p>The fish and rod pictures are third-party art. They may be used inside this game. They are not a separate download, and they are not licensed for reuse on their own.</p>
              <p>Do not put passwords, keys, or private notes in the yard. Report a security problem in the GitHub repository under Security, not in a public issue with exploit details.</p>
            </details>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="slot" style={{ width: "auto", padding: "6px 10px" }} onClick={() => { panelRef.current = null; setPanel(null); }}>
                {panel === "summary" ? "Keep going" : "Resume"}
              </button>
              <button
                className="slot"
                style={{ width: "auto", padding: "6px 10px" }}
                onClick={() => {
                  if (!wipe) {
                    setWipe(true);
                    return;
                  }
                  start(true);
                }}
              >
                {wipe ? "Really wipe this yard?" : "New homestead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {menu && (
        <div
          className="panel menu"
          style={{ left: Math.min(menu.x, window.innerWidth - 200), top: Math.min(menu.y, window.innerHeight - 220) }}
        >
          {menu.rows.map((row) => (
            <button
              key={row.label}
              onClick={() => {
                row.run();
                setMenu(null);
              }}
            >
              {row.label}
            </button>
          ))}
        </div>
      )}
      <span style={{ display: "none" }}>{tick}</span>
    </main>
  );
}

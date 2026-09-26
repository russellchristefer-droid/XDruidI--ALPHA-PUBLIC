import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { IconRef, GameState, Item, PanelId, EquipSlot } from "@/game/content";
import {
  MASS_CAP,
  SAVE_KEY,
  WORLD_H,
  WORLD_W,
  VIEW_H,
  VIEW_W,
  clockLabel,
  createGame,
  defOf,
  isNight,
  lifeLabel,
  skyLabel,
} from "@/game/content";
import { ART, loadSheets, type Sheets } from "@/game/assets";
import { loadGroveWalkerSheet } from "@/groveCrownWalker13.js";
import { armWind, heavyWind, onSound, setVolume, setWind, soundState, syncSky, toggleMute } from "@/game/audio";
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
  watcherLine,
  withdraw,
  type InteractResult,
} from "@/game/logic";
import { BAK1, BAK2, readSaveFrom, writeSave, type SaveStore } from "@/game/save";
import { MapEditor, builderDevAllowed } from "@/components/MapEditor";
import { draftDevPrompt } from "@/game/draft-prompt";
import { copyText } from "@/game/copy-text";
import type { Rect } from "@/game/content";
import {
  blockRect,
  drawEditorBox,
  editorOrder,
  loadTileLayer,
  paintRect,
  flushTiles,
  snapRect,
  type PaintId,
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
} as const;

const CONTROLS = `WASD or arrows    Move. 4 directions.
Shift             Walk faster while stamina holds. A heavy pack refuses.
Left click        Use the highlighted tile.
Right click       Examine, or a short menu.
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

type Menu = { x: number; y: number; rows: { label: string; run: () => void }[] };

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

function SoundControls() {
  const [snd, setSnd] = useState(soundState);
  useEffect(() => onSound(() => setSnd(soundState())), []);
  return (
    <div className="sound-row" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="slot"
        style={{ width: "auto", padding: "4px 8px" }}
        aria-pressed={snd.muted}
        onClick={() => toggleMute()}
      >
        {snd.muted ? "Muted" : "Mute"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={snd.volume}
        aria-label="Volume"
        onChange={(e) => setVolume(Number(e.target.value))}
      />
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
  const screenRef = useRef<"title" | "play">("title");
  const panelRef = useRef<PanelId | null>(null);
  const stickRef = useRef({ x: 0, y: 0 });
  const runHold = useRef(false);
  const skipTap = useRef(false);
  const padRef = useRef<boolean[]>(Array.from({ length: 16 }, () => false));
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
  const [editMode, setEditMode] = useState<"box" | "paint">("box");
  const [editTile] = useState<PaintId>("grass");
  const [editSel, setEditSel] = useState<Rect | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const editorRef = useRef({
    open: false,
    mode: "box" as "box" | "paint",
    tile: "grass" as PaintId,
    drag: null as { x: number; y: number } | null,
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
      if (ed.mode === "box") {
        const box = snapRect(ed.drag, w);
        ed.sel = box;
        ed.live = null;
        setEditSel(box);
      }
      ed.drag = null;
      if (ed.mode === "paint") flushTiles();
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
    loadSheets()
      .then((sheets) => {
        if (dead) return;
        sheetsRef.current = sheets;
        loadTileLayer();
        if (!stateRef.current) stateRef.current = readSave() ?? createGame();
        return loadGroveWalkerSheet();
      })
      .then(() => {
        if (dead) return;
        setReady(true);
        if (new URLSearchParams(location.search).has("qa")) {
          screenRef.current = "play";
          setScreen("play");
        }
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "The yard art failed to load."));
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
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
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
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const sheets = sheetsRef.current;
      const s = stateRef.current;
      if (canvas && sheets && s) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const fit = Math.min(w / VIEW_W, h / VIEW_H);
        const scale = Math.max(1, Math.floor(fit));
        let camY = 0;
        if (s.y > VIEW_H - 48) camY = s.y - (VIEW_H - 48);
        camY = Math.round(Math.max(0, Math.min(WORLD_H - VIEW_H, camY)));
        const ox = Math.floor((w - VIEW_W * scale) / 2);
        const oy = Math.floor((h - VIEW_H * scale) / 2) - camY * scale;
        camRef.current = { scale, ox, oy };
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = "#172014";
          ctx.fillRect(0, 0, w, h);
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
            const edge = (i: number) => !!gp.buttons[i]?.pressed && !padRef.current[i];
            if (edge(0)) api.current.useAt(facingPoint(s).x, facingPoint(s).y);
            if (edge(1) && panelRef.current) api.current.toggle(panelRef.current);
            if (edge(2)) api.current.toggle("pack");
            if (edge(3)) api.current.toggle("body");
            if (edge(4)) selectHotbar(s, s.selected - 1);
            if (edge(5)) selectHotbar(s, s.selected + 1);
            if (edge(9)) api.current.toggle("pause");
            for (let i = 0; i < 16; i++) padRef.current[i] = !!gp.buttons[i]?.pressed;
          }
          if (screenRef.current === "play") {
            step(s, dt, {
              mx,
              my,
              run,
              frozen: panelRef.current !== null || editorRef.current.open,
            });
            setWind(heavyWind(s.time, s.day));
            syncSky(s.weather, s.bolts);
            if (s.uiEvent) {
              const ev = s.uiEvent;
              s.uiEvent = undefined;
              api.current.apply(ev);
            }
          }
          const tool = findItem(s, s.activeId);
          drawWorld(ctx, s, sheets, hoverRef.current, !!tool && defOf(tool).tool === "shovel");
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
      if (acc > 0.12) {
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
    if (code === "Escape") {
      if (menu) setMenu(null);
      else toggle("pause");
      return;
    }
    if (code === "KeyI") return toggle("pack");
    if (code === "KeyC") return toggle("body");
    if (code === "KeyM") return toggle("map");
    if (code === "KeyB") {
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
    armWind();
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
          if (!ed.open || !ed.drag || !w) return;
          if (ed.mode === "box") ed.live = snapRect(ed.drag, w);
          else paintRect({ x: Math.floor(w.x / 16) * 16, y: Math.floor(w.y / 16) * 16, w: 16, h: 16 }, ed.tile, false);
        }}
        onPointerLeave={() => {
          hoverRef.current = null;
        }}
        onPointerDown={(e) => {
          if (screenRef.current !== "play") return;
          const w = worldOf(e.clientX, e.clientY);
          if (!w) return;
          const ed = editorRef.current;
          if (ed.open) {
            e.preventDefault();
            if (ed.mode === "box") {
              ed.drag = w;
              ed.live = snapRect(w, w);
            } else {
              paintRect({ x: Math.floor(w.x / 16) * 16, y: Math.floor(w.y / 16) * 16, w: 16, h: 16 }, ed.tile);
              ed.drag = w;
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
            if (ed.mode === "box") {
              const box = snapRect(ed.drag, w);
              ed.sel = box;
              ed.live = null;
              setEditSel(box);
            }
            ed.drag = null;
            if (ed.mode === "paint") flushTiles();
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
            <div className="panel" style={{ padding: "6px 8px", fontSize: 13 }}>
              <div>
                {clockLabel(s.time)} · Day {s.day} · {skyLabel(s)}
              </div>
              <div style={{ color: "#c4a574" }}>{s.life ? lifeLabel(s.life) : ""}</div>
              <div style={{ color: "#c4a574", maxWidth: 220 }}>{watcherLine(s)}</div>
              <button
                type="button"
                className="slot"
                style={{ pointerEvents: "auto", marginTop: 6, width: "auto", padding: "4px 8px" }}
                onClick={() => {
                  s.auto = s.auto === false;
                  if (!s.auto) {
                    s.life.errand = null;
                    s.life.route = [];
                    s.life.chore = "";
                  }
                  s.message = s.auto ? "Autonomy on. She tends the farm." : "Autonomy off. She waits for you.";
                  persist(s);
                  bump();
                }}
              >
                {s.auto === false ? "Autonomy off" : "Autonomy on"}
              </button>
            </div>
            <div className="panel" style={{ padding: "6px 8px", fontSize: 13, textAlign: "right" }}>
              <div>Stamina {Math.round(s.stamina)}</div>
              <div className="meter" style={{ marginLeft: "auto" }}>
                <span style={{ width: `${Math.max(0, Math.min(100, s.stamina))}%`, background: s.stamina < 20 ? "#e07a5f" : "#7dba5a" }} />
              </div>
              <div style={{ color: mass >= 16 ? "#e07a5f" : "#f3e6c8" }}>
                {mass.toFixed(1)} / {MASS_CAP.toFixed(1)} wt
              </div>
              <SoundControls />
            </div>
          </div>
          <div className="hotbar-wrap">
            {s.message && (
              <div className="prompt" style={{ maxWidth: "100%" }}>
                {s.message}
              </div>
            )}
            <div className="prompt">{prompt || (s.downed ? "Downed — crawl to the bathtub  [E]" : " ")}</div>
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
                    {it && d && <Icon icon={d.icon} size={30} />}
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
            setEditorOpen((v) => {
              const next = !v;
              if (next) {
                editorRef.current.mode = "box";
                setEditMode("box");
              }
              return next;
            });
            setEditStatus("");
          }}
          sel={editSel}
          note={editNote}
          setNote={(v) => {
            setEditNote(v);
            setDraft("");
          }}
          onBlock={(blocked) => {
            if (!editSel) {
              setEditStatus("Drag a rectangle on the yard first.");
              return;
            }
            blockRect(editSel, blocked);
            setEditStatus(blocked ? "That square blocks walking." : "That square is open to walk.");
          }}
          onSend={() => {
            if (drafting) return;
            if (!editSel || !editNote.trim()) {
              setEditStatus(editSel ? "Write what you want, then press Write prompt." : "Drag a rectangle, then write what you want.");
              return;
            }
            if (draft) {
              setEditStatus(copyText(draft) ? "Copied. Paste it into the chat." : "Select the prompt and copy it by hand.");
              return;
            }
            const sel = editSel;
            const note = editNote.trim();
            setDrafting(true);
            setEditStatus("Writing the prompt…");
            draftDevPrompt({ data: { note, x: sel.x, y: sel.y, w: sel.w, h: sel.h } })
              .then(({ prompt }) => {
                setDraft(prompt);
                setEditStatus(copyText(prompt) ? "Copied. Paste it into the chat." : "Prompt is ready. Press Copy.");
              })
              .catch(() => {
                const plain = editorOrder(sel, note);
                setDraft(plain);
                setEditStatus("The writer failed. Press Copy for the plain version.");
              })
              .finally(() => setDrafting(false));
          }}
          status={editStatus}
          draft={draft}
          busy={drafting}
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
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                runHold.current = true;
                setRunning(true);
              }}
              onPointerUp={() => {
                runHold.current = false;
                setRunning(false);
              }}
              onPointerCancel={() => {
                runHold.current = false;
                setRunning(false);
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
            }}
            onPointerUp={() => {
              stickRef.current = { x: 0, y: 0 };
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
              <button className="slot" style={{ width: "auto", padding: "8px 14px" }} disabled={!ready} onClick={() => start(false)}>
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
            <h2>{panel === "vault" ? "House stores" : "Inventory"}</h2>
            <p style={{ marginTop: 0, fontSize: 13 }}>
              {s.pack.filter(Boolean).length}/28 slots · {mass.toFixed(1)} / {MASS_CAP.toFixed(1)} · Floor purse {coinCount(s)}
              {panel === "vault" ? " · The chest is beside the pack. Click a pack item, then a chest slot, to store it." : " · Click an item, then a body slot, to equip it."}
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
                <p style={{ fontSize: 12, maxWidth: 200 }}>Click a worn slot to stow it. Tools go on the hands. Clothes go on their own slot.</p>
              </div>
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
          <div className="panel sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h2>Yard legend</h2>
            <div style={{ position: "relative", width: "100%", maxWidth: 347 }}>
              <img src={`/game/yard.png?v=${ART}`} alt="The homestead yard" style={{ width: "100%", imageRendering: "pixelated" }} />
              <span
                style={{
                  position: "absolute",
                  left: `${(s.x / WORLD_W) * 100}%`,
                  top: `${(s.y / WORLD_H) * 100}%`,
                  width: 8,
                  height: 8,
                  background: "#e2b657",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <ul style={{ fontSize: 13 }}>
              <li>Gate south, on the path.</li>
              <li>Beds west and center. Well and pond north.</li>
              <li>Grindstone, workbench, and house east.</li>
              <li>Campfire and tub on the north grass.</li>
              <li>Cow, rooster, and goat by the shed.</li>
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

import { useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";
import type { Rect } from "@/game/content";
import type { SpriteDef } from "@/game/dev-sprites";
import { editorOrder, GRID, type SelMode } from "@/game/tiles";

const MODES: { id: SelMode; label: string }[] = [
  { id: "rect", label: "Rect" },
  { id: "tile", label: "Tile" },
  { id: "cell", label: "Cell" },
  { id: "row", label: "Row" },
  { id: "column", label: "Column" },
  { id: "yard", label: "Yard" },
  { id: "meadow", label: "Meadow" },
  { id: "world", label: "World" },
  { id: "here", label: "Druid" },
  { id: "sprite", label: "Stamp" },
];

/** This builder session only. A published build never shows it. */
export function builderDevAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.DEV) return false;
  return window.location.hostname.toLowerCase() !== "xdruidi.grok.me";
}

export function MapEditor({
  open,
  onToggle,
  sel,
  note,
  setNote,
  onBlock,
  onSend,
  status,
  draft,
  busy,
  mode,
  setMode,
  preview,
  cameraRef,
  sprites,
  rev,
  armed,
  onArm,
  onUpload,
  onLift,
}: {
  open: boolean;
  onToggle: () => void;
  sel: Rect | null;
  note: string;
  setNote: (v: string) => void;
  onBlock: (blocked: boolean) => void;
  onSend: () => void;
  status: string;
  draft: string;
  busy: boolean;
  mode: SelMode;
  setMode: (mode: SelMode) => void;
  preview: RefObject<HTMLCanvasElement | null>;
  cameraRef: RefObject<{ scale: number; ox: number; oy: number }>;
  sprites: SpriteDef[];
  rev: number;
  armed: string | null;
  onArm: (id: string) => void;
  onUpload: (file: File) => void;
  onLift: () => void;
}) {
  const order = sel && note.trim() ? editorOrder(sel, note) : "";
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && sel) promptRef.current?.focus();
  }, [open, sel]);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      const src = preview.current;
      const dst = liveRef.current;
      const cam = cameraRef.current;
      if (src && dst && cam) {
        const ctx = dst.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = "#120e0a";
          ctx.fillRect(0, 0, dst.width, dst.height);
          const top = 96;
          const fit = Math.min(dst.width / src.width, top / src.height);
          const dw = src.width * fit;
          const dh = src.height * fit;
          ctx.drawImage(src, (dst.width - dw) / 2, (top - dh) / 2, dw, dh);
          if (sel && cam.scale > 0) {
            const sx = cam.ox + sel.x * cam.scale;
            const sy = cam.oy + sel.y * cam.scale;
            const sw = Math.max(1, sel.w * cam.scale);
            const sh = Math.max(1, sel.h * cam.scale);
            const band = dst.height - top - 8;
            const zoom = Math.min((dst.width - 8) / sw, band / sh);
            const zw = sw * zoom;
            const zh = sh * zoom;
            ctx.drawImage(src, sx, sy, sw, sh, (dst.width - zw) / 2, top + 4 + (band - zh) / 2, zw, zh);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, sel, preview, cameraRef]);
  const lastPress = useRef(0);
  const press = (e: { stopPropagation: () => void }, fn: () => void) => {
    e.stopPropagation();
    const now = performance.now();
    if (now - lastPress.current < 280) return;
    lastPress.current = now;
    fn();
  };
  const fire = (fn: () => void) => ({
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => press(e, fn),
    onClick: (e: MouseEvent<HTMLButtonElement>) => press(e, fn),
  });
  return (
    <div className="map-edit">
      <button type="button" className={`edit-fab${open ? " on" : ""}`} {...fire(onToggle)} aria-pressed={open}>
        <span className="mark" aria-hidden="true" />
        <span className="edit-fab-copy">
          <span className="edit-fab-kicker">Builder</span>
          <span className="edit-fab-name">{open ? "Close" : "Developer"}</span>
        </span>
      </button>
      {open && (
        <div className="panel map-edit-panel" role="dialog" aria-label="Developer mode">
          <canvas ref={liveRef} className="map-live" width={520} height={280} aria-label="Live game" />
          <p className="map-edit-hint">The game keeps running. Pick a selection, say what you mean, then Write prompt.</p>
          <div className="map-edit-modes">
            {MODES.map((m) => (
              <button key={m.id} type="button" className={mode === m.id ? "on" : ""} {...fire(() => setMode(m.id))}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="map-edit-meta">
            {sel
              ? `x ${sel.x}–${sel.x + sel.w}  y ${sel.y}–${sel.y + sel.h} · ${Math.max(1, Math.round(sel.w / GRID))}×${Math.max(1, Math.round(sel.h / GRID))} cells`
              : "No selection yet"}
          </div>
          <textarea
            ref={promptRef}
            value={note}
            placeholder="Say what you mean. The prompt will explain it."
            aria-label="What you want done"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && order) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button
            type="button"
            className="send"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onSend();
            }}
          >
            {busy ? "Writing…" : draft ? "Copy" : "Write prompt"}
          </button>
          {draft && <pre className="map-edit-order">{draft}</pre>}
          {status && <p className="map-edit-hint">{status}</p>}
          <div className="map-edit-row">
            <button type="button" {...fire(() => fileRef.current?.click())}>
              Attach sprite
            </button>
            <button type="button" {...fire(onLift)}>
              Lift
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/gif,image/webp,image/jpeg"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUpload(file);
            }}
          />
          {sprites.length > 0 && (
            <div className="sprite-tray">
              {sprites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={armed === s.id ? "on" : ""}
                  title={`${s.id} ${s.w}×${s.h}`}
                  {...fire(() => onArm(s.id))}
                >
                  <img src={`${s.file}?v=${rev}`} alt={s.id} />
                </button>
              ))}
            </div>
          )}
          <div className="map-edit-row">
            <button type="button" {...fire(() => onBlock(true))}>
              Block
            </button>
            <button type="button" {...fire(() => onBlock(false))}>
              Open
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

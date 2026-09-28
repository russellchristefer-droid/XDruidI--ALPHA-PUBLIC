import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import type { Rect } from "@/game/content";
import { GRID, type SelMode } from "@/game/tiles";

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
];

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
  onCopy,
  status,
  order,
  mode,
  setMode,
}: {
  open: boolean;
  onToggle: () => void;
  sel: Rect | null;
  note: string;
  setNote: (v: string) => void;
  onCopy: () => void;
  status: string;
  order: string;
  mode: SelMode;
  setMode: (mode: SelMode) => void;
}) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (open && sel) promptRef.current?.focus();
  }, [open, sel]);
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
          <p className="map-edit-hint">Select tiles, write the change, then copy the work order.</p>
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
            placeholder="What should change in the selection."
            aria-label="What you want done"
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          {order && <pre className="map-edit-order">{order}</pre>}
          <button type="button" className="send" disabled={!order} {...fire(onCopy)}>
            Copy
          </button>
          {status && <p className="map-edit-hint">{status}</p>}
        </div>
      )}
    </div>
  );
}

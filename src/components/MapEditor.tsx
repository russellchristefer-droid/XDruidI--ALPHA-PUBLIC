import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import type { Rect } from "@/game/content";
import { editorOrder, GRID } from "@/game/tiles";

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
}) {
  const order = sel && note.trim() ? editorOrder(sel, note) : "";
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
          <p className="map-edit-hint">Drag a rectangle, write what you want, then Write prompt.</p>
          <div className="map-edit-meta">
            {sel
              ? `x ${sel.x}–${sel.x + sel.w}  y ${sel.y}–${sel.y + sel.h} · ${Math.round(sel.w / GRID)}×${Math.round(sel.h / GRID)} tiles`
              : "No rectangle yet"}
          </div>
          <textarea
            ref={promptRef}
            value={note}
            placeholder="Prompt for this rectangle"
            aria-label="Prompt for this rectangle"
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

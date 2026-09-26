// @ts-nocheck
/**
 * GROK BUILD PASTE — Grove Crown Walker
 * 13-frame walk FORWARD + 13-frame walk BACK
 * Breast bounce is baked into the sheet (delayed 1 frame after footfall).
 * Flame flicker is baked into the back row.
 *
 * How to use in Grok Build:
 * 1. Create this file as src/groveCrownWalker13.js
 * 2. Import drawGroveWalker / GroveWalkerPreview in your scene
 * 3. facing: "forward" | "back"
 *
 * Sheet layout:
 *   row 0 = walk toward camera (frames 0..12)
 *   row 1 = walk away from camera (frames 0..12)
 *   each cell = 96 x 176
 *   loop at 12 fps (83ms). foot_land markers on frames 0 and 6.
 */
export const GROVE_WALKER = {
  id: "grove-crown-walker-13",
  frameW: 96,
  frameH: 176,
  frameCount: 13,
  rows: { forward: 0, back: 1 },
  fps: 12,
  frameMs: 83,
  loop: true,
  footLandFrames: [0, 6],
  bouncePixels: [0, 1, 3, 4, 2, 0, 0, 1, 3, 4, 2, 0, 1],
  notes: {
    bounce: "Chest mass peaks downward on passing frames 2-3 and 8-9, delayed one frame after contact.",
    flame: "Back-row ember cycles height and spark count across the 13 frames.",
  },
};

export const GROVE_WALKER_SHEET_URL = "/game/char/grove-crown-walker.png";

let _sheet = null;
let _loadPromise = null;

export function loadGroveWalkerSheet() {
  if (_sheet && _sheet.complete) return Promise.resolve(_sheet);
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { _sheet = img; resolve(img); };
    img.onerror = reject;
    img.src = GROVE_WALKER_SHEET_URL;
  });
  return _loadPromise;
}

export function groveWalkerReady() {
  return !!(_sheet && _sheet.complete && _sheet.naturalWidth > 0);
}

export function groveWalkerFrameIndex(elapsedMs) {
  const { frameCount, frameMs } = GROVE_WALKER;
  return Math.floor(elapsedMs / frameMs) % frameCount;
}

/**
 * Draw one frame into a canvas 2D context.
 * dx, dy = top-left of the sprite on the destination canvas.
 * scale should stay an integer (1, 2, 3...) for nearest-neighbor pixels.
 */
export function drawGroveWalker(ctx, facing, frameIndex, dx, dy, scale = 2) {
  if (!_sheet) return;
  const { frameW, frameH, rows, frameCount } = GROVE_WALKER;
  const i = ((frameIndex % frameCount) + frameCount) % frameCount;
  const row = rows[facing] ?? 0;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    _sheet,
    i * frameW,
    row * frameH,
    frameW,
    frameH,
    dx,
    dy,
    frameW * scale,
    frameH * scale
  );
}

/** Tiny preview widget you can mount anywhere in Grok Build. */
export function mountGroveWalkerPreview(rootEl) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "font: 13px/1.4 ui-monospace,monospace; color:#f4e7c8; background:#1b1210; padding:16px; border-radius:12px;";
  wrap.innerHTML = `
    <div style="margin-bottom:8px">Grove Crown Walker — 13 forward / 13 back</div>
    <label>facing
      <select id="gw-facing">
        <option value="forward">forward</option>
        <option value="back">back</option>
      </select>
    </label>
    <canvas id="gw-canvas" width="192" height="352" style="display:block;margin-top:10px;image-rendering:pixelated;background:#c71585"></canvas>
    <div id="gw-meta" style="margin-top:8px;opacity:.8"></div>
  `;
  rootEl.appendChild(wrap);
  const canvas = wrap.querySelector("#gw-canvas");
  const ctx = canvas.getContext("2d");
  const sel = wrap.querySelector("#gw-facing");
  const meta = wrap.querySelector("#gw-meta");
  const t0 = performance.now();
  loadGroveWalkerSheet().then(() => {
    const tick = (now) => {
      const i = groveWalkerFrameIndex(now - t0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGroveWalker(ctx, sel.value, i, 0, 0, 2);
      const land = GROVE_WALKER.footLandFrames.includes(i) ? " foot_land" : "";
      meta.textContent = `frame ${i + 1}/13  bounce ${GROVE_WALKER.bouncePixels[i]}px${land}`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return wrap;
}

export default GROVE_WALKER;

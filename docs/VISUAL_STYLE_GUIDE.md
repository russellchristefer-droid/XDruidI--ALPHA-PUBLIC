# Visual Style Guide — XDruid I / Assay Homestead

**Living document.** Update in the same slice as any visual system or asset change.  
**Dated entries below.**  
**Hyper-realism check:** A senior 2D art director at a major studio would approve this guide as enforceable if every new or revised asset can be pass/fail scored against the checklists in Sections 4–7 without subjective debate. If a section fails that test, revise it before shipping.

Governing sources: `AGENTS.project.md` (art direction and gap policy), `src/game/xdruid-mandate.ts`, Farm Life pack ground truth (sophi-x-x), and the existing `docs/STYLE_GUIDE.md` cross-links.

## 1. Core Non-Negotiables

- Base grid: 16×16 pixels. Display scale: integer only (normally 2× → 32×32). No fractional scales.
- Scaling: nearest-neighbor exclusively. Canvas `imageSmoothingEnabled = false` (or equivalent) is mandatory. No bilinear, no mipmaps, no anti-aliasing on sprite edges.
- Pixel-grid integrity: every pixel sits on the grid. No subpixel placement, no mixed resolutions, no smoothed outlines. Outline weight is 1 px (on the 16 px grid) and consistent across an asset family.
- Palette discipline: warm base derived from the Farm Life pack. Per-realm shifts are controlled tints, not free-for-all. Total unique colors per sprite ≤ 32 unless a documented exception is approved.
- No generic fantasy tropes (generic castles, stock dragons, undifferentiated glowing orbs). Every realm must read as a distinct material and lighting world that still belongs to the same craft language as the homestead farm.
- High-fidelity pixel realism is produced by: animation timing, directional lighting, material response, weather interaction, and cause-and-effect. It is never produced by high-resolution noise, photo overlays, or mixed pixel densities.
- Credit: sophi-x-x remains in credits. Derived assets are recorded; raw pack files are never redistributed.

## 2. Palette Language

Anchor the homestead farm as the reference standard. All other realms are measured against it.

- Farm / Homestead (reference): earth browns, olive greens, warm wood ochres, soft sky blue. Soil darkens when wet. Wood shows grain via 1–2 px value steps, not dither noise.
- Svarga (luminous upper realm): high-key, golden-hour perpetual. Key anchors: warm gold (#f4d78a range), pale stone, soft cyan highlights. Light shafts are hard-edged pixel steps, never soft gradients.
- Naraka (heat and depth): low-key, ember-driven. Key anchors: deep basalt, sulfur ochre, rim-light crimson from below. Heat shimmer is particle-based (pack particles preferred), not screen distortion that breaks the grid.
- Skill Grove: cool verdant, denser foliage value range, filtered light through canopy (hard pixel light spots).
- Combat / Quarry / Floor 332 / Mansion: each receives a documented one-paragraph identity and three anchor colors before any asset is drawn. Generic stone dungeon is forbidden.

Palette shifts must preserve silhouette readability at 16 px and at 32 px display.

## 3. Lighting Language

- Day-night cycle drives a global color grade. Sun angle is consistent within a day; shadows fall in one direction per time slice.
- Bounce light is limited to 1 px value lift on adjacent surfaces. No ambient fill that flattens form.
- Campfire, lantern, and portal light are local and fall off in discrete steps (typically 2–4 px bands).
- Rim lighting is allowed only when it reinforces material (metal edge, wet stone, cloth fold). It must not create a cartoon outline.
- Weather: wet soil darkens and reflects a 1 px highlight streak; frost is an overlay of existing tile edges, not a new texture set unless gap-approved.

## 4. Material Rendering

Each material must have a distinct response that is visible at 16 px:

- Wood: grain direction, chip particles on impact, darkening when wet.
- Soil: wet/dry state change, footprint compression, no random noise.
- Stone: hard edge highlights, chip particles, no soft bevels.
- Cloth: fold planes in 2–3 value steps, wind response via animation not static dither.
- Water: 4-frame pack loop preferred; surface reflects sky/light in hard steps.
- Metal: specular is 1–2 px hard highlight, not bloom.

Cause-and-effect is mandatory: rain darkens soil; fire lights nearby tiles and consumes fuel; tools leave visible wear or residue where the system supports it.

## 5. Composition and Depth

- Readable silhouettes first. Every object identifiable by shape alone at display scale.
- Depth via occlusion order, layered parallax limited to integer tile offsets, and consistent shadow direction. No fake 3D perspective that breaks the orthographic pixel grid.
- Portal interiors must establish their own horizon and light direction within the first screen so the player cannot confuse them with the farm.

## 6. Pixel-Grid Integrity and Scaling Checklist (Enforceable)

Pass/fail for every asset before it ships:

1. Base dimensions are multiples of 16 px.
2. No anti-aliased edges (zoom to 1:1 and inspect).
3. Outline weight is uniform within the asset family.
4. Nearest-neighbor scaling only; no browser or canvas smoothing.
5. Color count ≤ 32 (or documented exception).
6. Silhouette remains readable when desaturated.
7. Lighting and material response match the realm identity paragraph.

Fail any item → asset does not ship. File the defect against this guide.

## 7. Fidelity Bar — Svarga / Naraka / Farm

The farm is the craft baseline. Svarga and Naraka are the current high-fidelity reference interiors. Any new portal or major asset must be audited side-by-side against these three:

- Does it match the farm’s pixel density and outline discipline?
- Does its lighting language feel like the same studio made it, even if the palette and mood differ?
- Is its material response as specific as wet soil on the farm or ember rim on Naraka?
- Can a player identify the realm from a single screen without UI labels?

If the answer to any is no, the asset drifts and must be revised or rejected.

## 8. Per-Realm Visual Identities (Living)

Each portal interior must be unmistakably its own while matching the craft quality above. Identities are one-paragraph + three anchor colors. Expand as realms are built. No asset ships without a style-guide pass against its realm paragraph.

- **Farm / Homestead:** Warm, readable, cause-and-effect rural. Soil, wood, grass, water, animals all respond to weather and use. Anchors: soil brown, wood ochre, grass olive.
- **Svarga:** Perpetual golden high-key, floating stone and light shafts that remain hard-edged. Ethereal through material purity, not glow. Anchors: warm gold, pale limestone, soft cyan.
- **Naraka:** Heat from below, cracked basalt, ember particles, heavy low-key shadows with crimson rim. Anchors: basalt, sulfur ochre, ember crimson.
- **Skill Grove:** Dense canopy-filtered light, cooler greens, living foliage that reacts to skill use. Anchors: deep leaf green, filtered gold spots, bark brown.
- **Combat:** (To be defined before assets.) Must not default to generic dungeon stone.
- **Quarry:** (To be defined.) Exposed cut stone, dust, tool marks.
- **Floor 332:** (To be defined.) Institutional or anomalous; not generic sci-fi or fantasy.
- **Mansion:** (To be defined.) Domestic decay or refinement that still reads as the same pixel craft.

## 9. Dated Guide Updates

- **2026-10-31:** Initial enforceable guide established. Sections 1–7 set the pass/fail bar. Per-realm identities seeded for farm, Svarga, Naraka, Skill Grove. Remaining realms flagged for definition before art. Cross-linked from `docs/STYLE_GUIDE.md`. No assets audited yet (requires visual inspection of live build or packed atlases).

## 10. Audit Process

New or revised assets receive a style-guide pass before merge. Defects are filed as issues referencing the failed checklist item. Drift is any departure from Sections 1–7 or the relevant realm identity.

This guide is the living reference. Update it when the fidelity bar or realm identities change.

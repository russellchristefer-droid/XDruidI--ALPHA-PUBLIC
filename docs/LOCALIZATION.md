# Localization Framework

**Dated:** 2026-10-26  
**Status:** Skeleton shipped. English source locale in public/locales/en.json.  
**Hyper-realism check:** Adding a second language (e.g. Spanish) by dropping public/locales/es.json will load without code changes. Layout survival depends on callers of t() measuring or truncating variable-length strings, especially canvas fillText in draw.ts. Current hardcoded paths bypass the system and will not translate.

## Pipeline
- English is source of truth.
- Future locales: drop `{code}.json` into public/locales/.
- initI18n() at boot; t(key) everywhere for user-facing text.
- Missing key falls back to English, then raw key.

## Defects
Any remaining literal string in AssayGame.tsx, draw.ts, logic.ts, content.ts (names, blurbs, notifications, HUD, lore, menus) that is not routed through t() is a defect. Full extraction is incomplete in this slice.

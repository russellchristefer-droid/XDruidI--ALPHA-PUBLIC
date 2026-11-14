# Public Roadmap — XDruid I / Assay Homestead

**Dated:** 2026-11-14  
**Work order:** REL-001  
**Status:** Living. Reflects committed versus aspirational work without overpromising.  
**Hyper-realism check:** A player or journalist reading this and the version notes can trust that committed items match what is in the public source and (when published) the live yard. Aspirational items are explicitly not committed.

## Committed (in source or live alpha as of 2026-11-14)

- Persistent homestead yard with beds, animals (cow, rooster, goat, sow, cat), fishing pond, magic courtyard.  
- Portals to lands (Svarga, Naraka, Skill Grove, Combat, Quarry, Floor 332, Mansion, etc.).  
- Pack of 28 slots with weight. Tools spend Floor. Day/night clock. Local save with checksum, backups, quarantine.  
- Individual animals and the cat retain typed persistent memory across sessions; bond emerges from repeated interaction (MEMORY-001). Old saves migrate safely. Visible in behavior; no menu toggle.  
- Public changelog page in source (newest first, plain language, linked work-order IDs). Live publication awaits owner.  
- Gated build pipeline: typecheck, lint, tests, production build, bundle size budgets must pass before any commit can reach live (PIPELINE-001).  
- Modding: new content via typed definition files into the registry without touching engine code; sandbox; versioned API (MOD-001).  
- Opt-in local telemetry. Localization ready for English.  
- SNES LoROM and Python desktop sidecars (not the browser game).  
- Error boundaries, asset fallbacks, structured error log, save recovery (ERR-001, SAVE-005/006).  

## Aspirational (not committed; no dates)

- Full seasonal art and winter opening scene (gap: pack has no seasonal variants; code overlays only).  
- House interiors, furniture, beds as pack assets (gap policy applies).  
- Combat, spellcasting, sleeping, eating, injury, death animations (gaps).  
- Human NPCs beyond car drivers.  
- Full livestock and fauna beyond pack animals.  
- Clothing, armor, equipment sprites.  
- Magic effects, ritual circles, sacred groves as pack assets.  
- Stable 1.0 with complete living homestead on the live yard and published changelog.  
- Any real-money or external economy.  

Aspirational items follow the asset gap policy and require owner approval before becoming committed. They are not promised.

## Version state

Current: 0.1.0-alpha. See VERSION and docs/RELEASE_MANAGEMENT.md.

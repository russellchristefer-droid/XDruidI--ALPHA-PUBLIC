# System Maps

**Dated:** 2026-10-26

## World

- Homestead yard (upper farmland + sidewalk + courtyard) is the starting place.
- Meadow south of y=528.
- Portals / arches / DNA ladders lead to: Svarga, Naraka, Skill Grove, Combat Yard/Ring, Armour/Weapon Yard, Quarry, Sanctum, Market, Enchanting, Wilds, Floor 332, Tech Market, Medical, Biology, Library, Jyotisha, Mantra, Mansion.
- Visit Other Courtyard is marked offline.
- Spatial authority: pixel coordinates + TILE=8 grid for placement. Collision via tiles.ts / realmFeet.ts.

## Needs & Autonomy

Implemented in logic.ts. Needs drive behavior (cold → seek warmth, exhaustion → rest, etc.). Autonomy is a pipeline (scheduler → utility → plan → execute → interrupt + plain-language reason). Watcher can inspect. Exact starting values and full pipeline live in the vision docs; current alpha implements a subset.

## Farming

Three beds (west/center/east). Crops: tomato, cabbage, greens. Stages, watering, wilt, tilling. Scythe harvests, shovel tills, watering can pours (spends Floor).

## Animals

Cow, rooster, goat (pen), sow (trainable), black cat, plus NPCs (milkmaid, field hand, Xiang Su, reaper). Fed → ready products (milk, egg).

## Inventory & Equipment

28-slot pack with mass. Tools have Floor (durability). Wear slots. Nested containers. Coins, notes, repair kits.

## Magic

Nine casts only inside MAGIC_PLOT (courtyard). Hands-up animation.

## Time & Weather

DAY_SECONDS = 90. Clear more often than rain. Hour bell. Volume buses.

## Drawing

draw.ts paints the entire scene from state. Paint modules generate specific elements (gates, mosaic, etc.).

## Audio

Event-driven, not timer-driven. Mute must leave the game fully playable.

## Freshness

Any system change requires an update here in the same slice.

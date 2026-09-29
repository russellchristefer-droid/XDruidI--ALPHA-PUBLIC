# XDruid I

**Stage:** Alpha  
**Client:** Browser (phone and PC)  
**Sidecars:** SNES LoROM companion, Python desktop companion  
**Save:** Local to the browser. Not a stable format.

XDruid I is a SNES-style homestead. The live game is a website. Open it in a browser. A phone that tries to launch the link as an application has the wrong kind of link.

The druid keeps a floating yard. Farmland sits above the sidewalk, inside the art-deco frame. The courtyard under the sidewalk is the magic training plot. The vimana holds that courtyard over living space. Naraka is the west arch. Svarga is the east arch. The pictures in those mouths are the lands he is crossing to.

This alpha is playable and unfinished. Lands, gates, and the save can change. There is no warranty. See [LEGAL.md](LEGAL.md) and [SECURITY.md](SECURITY.md).

## Build

| Name | What it is |
|---|---|
| Browser client | The game. Phone and PC. |
| SNES sidecar | `snes/xdruid.sfc`. A 32 KB LoROM companion. Not a port. |
| Python sidecar | `python/xdruid.py`. A desktop window. Not a port. |

Alpha means the loop can be played and the art direction is set. It does not mean feature-complete, balanced, or safe to treat as 1.0. Do not treat a commit as a release.

## Lands in this alpha

| Land | How you enter |
|---|---|
| Homestead | Where a new game starts. Farm, sidewalk, courtyard. |
| Svarga | East arch. |
| Naraka | West arch. |
| Skill grove | Courtyard portal. |
| Combat yard | Courtyard portal. |
| Combat ring | Courtyard portal. |
| Armour yard | Courtyard portal, by the Svarga flag. |
| Weapon yard | Courtyard portal, by Naraka. |
| Quarry | Courtyard portal. |
| Sanctum | Courtyard portal. |
| Market | Courtyard portal. |
| Enchanting | Courtyard portal. |
| Wilds | Courtyard portal. |
| Floor 332 | Gold DNA ladder, high on the left of the courtyard. One open triangle. Space is outside the wall. |
| Tech market | Blue DNA ladder. Magic worked into machines. |
| Medical | Red DNA ladder. |
| Biology | Green DNA ladder. The farmer and the plants. |
| Library | Indigo DNA ladder, just above the combat yard portal. |
| Jyotisha | Star-silver DNA ladder, just above the quarry portal. |
| Mantra | Lotus DNA ladder, on the Svarga tile under the pond. |
| Visit Other Courtyard | Portal between the armour yard and the market. Marked offline. It does not open. |
| Mansion | Egyptian gate on the left of the courtyard, between the weapon yard and Jyotisha. The house rises after 6 branches and 2 repair kits. |

The other 332 floors are not cut yet. Floor 332 is the only descent floor in this alpha.

## What plays

- Day and night on the clock. Clear weather more often than rain. Heavy rain when rain comes. The hour bell.
- Crops, flowers, a pond, and a rod he holds in his hand. Fish are items from the pond.
- Cow and rooster in the courtyard, goat in the upper pen, black cat on the sidewalk and the courtyard, a sow on the farm who can be trained to follow, milkmaid with the cow, field hand on the farm. Xiang Su stands on the sidewalk. Grown crops draw in front of people and animals when they stand behind the beds.
- Emotion faces over the farmer, the same size and fall as the hearts.
- Nine casts in the courtyard only: fireball, nova, iceball, ice, spark, bolt, holy, poison, and drip. Hands rise when a cast starts, then come down.
- Volume buses: Master, Music, Weather, Animals, Bell.
- Mouse-wheel zoom on PC, including a view wider than the yard. The margin behind every map is the same space.
- A save that stays in that browser. Clearing site data wipes the homestead.

## Controls

PC: keyboard. Phone: stick on the left, round button on the right. The hotbar sits between them so the labels do not cover each other. The top bar is body, place, clock, and hands, with the volume buses in one row under that. Pause holds the controls, the legal note, and the security note.

## SNES sidecar

`snes/xdruid.sfc` is a 32 KB LoROM cartridge. Internal title: `XDRUID I ALPHA`. It is a homestead you can carry into an emulator. It is not the browser game. It does not include the DNA halls, Floor 332, the mansion, the offline visit gate, the sow, or the volume buses.

[Download xdruid.sfc](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/snes/xdruid.sfc)

Open it in Snes9x, bsnes, Mesen-S, or RetroArch with the snes9x core. Play notes are in [snes/README.md](snes/README.md). Rebuild with `python3 snes/build_rom.py`.

## Python sidecar

`python/xdruid.py` opens the yard in a desktop window. Window title: `XDruid I — Alpha`. It needs Python 3 and tkinter. No emulator and no npm. It is not the browser game.

[Download xdruid.py](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/python/xdruid.py)

```bash
python3 python/xdruid.py
```

WASD or the arrow keys walk. The mouse wheel zooms. Notes are in [python/README.md](python/README.md).

## Run the browser client

```bash
npm install
npm run dev
```

The dev server listens on port 8080. `npm test` runs the logic checks. `npm run typecheck` checks the types.

## Status

| Term | Meaning here |
|---|---|
| Alpha | Playable. Systems and art still move. |
| Sidecar | A smaller companion. Not feature parity. |
| Save | Browser local storage. Not guaranteed across builds. |
| Release | Not this. There is no stable version number yet. |

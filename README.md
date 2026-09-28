# XDruid I

**Alpha.** A SNES-style homestead you play in a browser on a phone or a computer. It is a website. It is not a file a phone should open as an application.

The druid keeps a floating yard. The farm sits above the sidewalk. The courtyard below the sidewalk is the magic training plot. Two archways on the sidewalk open onto other lands: Naraka to the west, Svarga (Amaravati) to the east. The pictures in those mouths are the places he is crossing to. Stepping back through them returns him to the homestead. Under the courtyard is the rock and open space. Space is its own light. It does not take the day color of the farm.

This build is a work in progress. The yard, the gates, and the days can change. There is no warranty. See [LEGAL.md](LEGAL.md) and [SECURITY.md](SECURITY.md).

## What is in this alpha

- A day and night clock, with clear weather more often than rain, and heavy rain when it does come.
- Crops, flowers, a pond, and a fishing rod he holds in his hand. Fish are items from the pond, not sprites swimming in it.
- A cow and a rooster in the courtyard, a goat in the upper pen, and a black cat that walks the sidewalk and the courtyard. Grown crops draw in front of animals and farmers.
- A field hand on the beds, smaller and slower than the druid, watering and working the farm. Xiang Su stands on the sidewalk.
- Nine cast circles under him while he trains in the courtyard: fireball, nova, iceball, ice, spark, bolt, holy, poison, and drip. Each keeps its own colors. Hands rise only while a cast starts.
- Separate volume for the weather, the music, the animals, and the master level.
- Mouse-wheel zoom on a computer, including a view wider than the yard. The margin behind every map is the same space.
- A save that stays in that browser. Clearing the site data wipes the homestead.

## Play

On a computer, use the keyboard. On a phone, use the stick on the left and the round button on the right. The hotbar and the action row sit between them so the labels do not cover each other. The top bar is split the same way on both sides: body on the left, the place and the clock in the middle, hands on the right, and the four volume sliders in one row under that. Pause holds the controls, the legal note, and the security note. The map names the farm, the sidewalk, the courtyard seal, the goat pen, Xiang Su, the cat, and the field hand.

Open the page in a browser. A link that the phone tries to launch as an app is the wrong kind of link. Use the site address.

## SNES sidecar

`snes/xdruid.sfc` is a 32 KB LoROM cartridge. It is a homestead you can carry into an emulator. It is not the browser game squeezed into the console. This cartridge has the goat pen and Xiang Su's mark on the sidewalk.

[Download xdruid.sfc](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/snes/xdruid.sfc)

Open it in Snes9x, bsnes, Mesen-S, or RetroArch with the snes9x core. How it plays is in [snes/README.md](snes/README.md). Rebuild it with `python3 snes/build_rom.py`.

## Python sidecar

`python/xdruid.py` runs the yard in a desktop window. It needs Python 3 and tkinter, which ships with Python on Windows and macOS. No emulator and no npm.

[Download xdruid.py](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/python/xdruid.py)

```bash
python3 python/xdruid.py
```

WASD or the arrow keys walk. The mouse wheel zooms out the same way it does in the browser. The goat stays in the upper pen. Xiang Su stands on the sidewalk.

## Run the browser game

```bash
npm install
npm run dev
```

The dev server listens on port 8080. `npm test` runs the logic checks. `npm run typecheck` checks the types.

## Status

Alpha means the loop is playable and the art direction is set, not that every system is finished. Saves are local. Balance, maps, and sprites will keep moving. Do not treat a commit as a stable release.

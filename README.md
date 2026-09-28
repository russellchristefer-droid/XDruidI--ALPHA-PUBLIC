# XDruid I

A browser game. Open it in a phone or computer browser. It is a website, not a file that needs an app.

## Play

On a computer, use the keyboard. On a phone, use the stick and the buttons along the bottom. Pause holds the controls, the legal note, and the security note.

The yard saves in that browser. Clearing the site data wipes the homestead.

## SNES sidecar

`snes/xdruid.sfc` is a 32 KB LoROM cartridge. It is the homestead you can carry into an emulator. It is not the browser game squeezed into the console. This build has the goat pen and Xiang Su's mark on the sidewalk.

[Download xdruid.sfc](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/snes/xdruid.sfc)

Open it in Snes9x, bsnes, Mesen-S, or RetroArch with the snes9x core. How it plays is in [snes/README.md](snes/README.md).

## Python sidecar

`python/xdruid.py` runs the same yard in a desktop window. It needs Python 3 and tkinter, which ships with Python on Windows and macOS. No emulator and no npm.

[Download xdruid.py](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/python/xdruid.py)

```bash
python3 python/xdruid.py
```

WASD or the arrow keys walk. The mouse wheel zooms out further, the same way it does in the browser. The goat stays in the upper-farm pen. Xiang Su stands on the sidewalk.

## Run it yourself

```bash
npm install
npm run dev
```

The dev server listens on port 8080. `npm test` runs the logic checks. `npm run typecheck` checks the types.

## Legal and security

See [LEGAL.md](LEGAL.md) and [SECURITY.md](SECURITY.md).

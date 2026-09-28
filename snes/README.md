# XDruid I — SNES sidecar

Alpha note: the browser game is the live homestead. This cartridge is a small sidecar of that yard, not a port of every system.

`xdruid.sfc` is a 32 KB LoROM cartridge. It is the homestead you can carry into an SNES emulator. It is not the browser game squeezed into the console. The console shows the yard, the seal, the west gate, the east gate, the goat pen on the upper farm, and Xiang Su's mark on the sidewalk.

Open `xdruid.sfc` in Snes9x, bsnes, Mesen-S, or RetroArch with the snes9x core. Load the file the way you would load any other game. Nothing else has to be installed.

[Download xdruid.sfc](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/snes/xdruid.sfc)

The D-pad walks. The west side of the path is Naraka, and the grass goes red. The east side is Svarga, and the grass goes gold. Walk back to the middle and the farm is green again. The fenced 7 by 3 patch on the upper right is the goat pen. XIANG marks where she stands on the sidewalk.

Rebuild it with `python3 snes/build_rom.py`.

The Python sidecar, which runs in a window without an emulator, is [python/xdruid.py](../python/xdruid.py). [Download it](https://github.com/russellchristefer-droid/XDruidI--ALPHA-PUBLIC/raw/main/python/xdruid.py) and start it with `python3 xdruid.py`.

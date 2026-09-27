#!/usr/bin/env python3
"""Build snes/xdruid.sfc — a LoROM cartridge sidecar of the homestead.

Open it in Snes9x, bsnes, Mesen, or RetroArch's snes9x core.
D-pad walks the yard. The west edge turns the grass to Naraka red.
The east edge turns it to Svarga gold. Step back to the middle for the farm.
"""

from __future__ import annotations

import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "xdruid.sfc"


def bgr(r: int, g: int, b: int) -> int:
    return ((b & 31) << 10) | ((g & 31) << 5) | (r & 31)


def tile2(rows: list[str]) -> bytes:
    out = bytearray()
    for y in range(8):
        row = rows[y]
        for bit in (0, 1):
            v = 0
            for x in range(8):
                if int(row[x]) & (1 << bit):
                    v |= 1 << (7 - x)
            out.append(v)
    return bytes(out)


def tile4(rows: list[str]) -> bytes:
    pix = [[int(c, 16) for c in row] for row in rows]
    out = bytearray()
    for group in (0, 2):
        for y in range(8):
            for bit in (group, group + 1):
                v = 0
                for x in range(8):
                    if pix[y][x] & (1 << bit):
                        v |= 1 << (7 - x)
                out.append(v)
    return bytes(out)


def solid(n: int) -> list[str]:
    return [str(n) * 8 for _ in range(8)]


def glyph(art: list[str]) -> list[str]:
    rows = []
    for line in art:
        s = line.ljust(8, ".")[:8]
        rows.append("".join("1" if ch == "#" else "0" for ch in s))
    while len(rows) < 8:
        rows.append("00000000")
    return rows


FONT = {
    " ": ["........"] * 8,
    "A": ["..##....", ".#..#...", "#....#..", "#....#..", "######..", "#....#..", "#....#..", "........"],
    "D": ["####....", "#...#...", "#....#..", "#....#..", "#....#..", "#...#...", "####....", "........"],
    "E": ["######..", "#.......", "#.......", "####....", "#.......", "#.......", "######..", "........"],
    "G": [".####...", "#.......", "#.......", "#..###..", "#....#..", "#....#..", ".####...", "........"],
    "I": ["######..", "..##....", "..##....", "..##....", "..##....", "..##....", "######..", "........"],
    "K": ["#...#...", "#..#....", "#.#.....", "##......", "#.#.....", "#..#....", "#...#...", "........"],
    "N": ["#....#..", "##...#..", "#.#..#..", "#..#.#..", "#...##..", "#....#..", "#....#..", "........"],
    "R": ["####....", "#...#...", "#...#...", "####....", "#.#.....", "#..#....", "#...#...", "........"],
    "S": [".####...", "#.......", "#.......", ".####...", ".....#..", ".....#..", "#####...", "........"],
    "U": ["#....#..", "#....#..", "#....#..", "#....#..", "#....#..", "#....#..", ".####...", "........"],
    "V": ["#....#..", "#....#..", "#....#..", "#....#..", ".#..#...", ".#..#...", "..##....", "........"],
    "X": ["#....#..", ".#..#...", "..##....", "..##....", "..##....", ".#..#...", "#....#..", "........"],
    "Y": ["#....#..", "#....#..", ".#..#...", "..##....", "..##....", "..##....", "..##....", "........"],
}


def grass() -> list[str]:
    rows = ["11111111"] * 8
    rows[1] = "11121111"
    rows[3] = "11211111"
    rows[6] = "11111211"
    return rows


def pond() -> list[str]:
    return [
        "33333333",
        "33133333",
        "33333313",
        "33333333",
        "31333333",
        "33333133",
        "33333333",
        "33333333",
    ]


def seal() -> list[str]:
    return [
        "22222222",
        "21111112",
        "21122112",
        "21122112",
        "21111112",
        "21111112",
        "22222222",
        "22222222",
    ]


def gate(fill: str) -> list[str]:
    return [
        "22222222",
        f"2{fill * 6}2",
        f"2{fill * 6}2",
        f"2{fill * 2}00{fill * 2}2",
        f"2{fill * 2}00{fill * 2}2",
        f"2{fill * 6}2",
        f"2{fill * 6}2",
        "22222222",
    ]


def fence() -> list[str]:
    return [
        "22222222",
        "20020020",
        "22222222",
        "02002002",
        "22222222",
        "20020020",
        "22222222",
        "02002002",
    ]


def path() -> list[str]:
    return ["22222222", "22222222", "21222212", "22222222", "22212222", "22222222", "22122222", "22222222"]


DRUID = [
    "00111100",
    "01222110",
    "01222110",
    "00111100",
    "01333310",
    "13333331",
    "01333310",
    "00111100",
]


class Asm:
    def __init__(self) -> None:
        self.org = 0x8000
        self.buf = bytearray()
        self.labels: dict[str, int] = {}
        self.fixups: list[tuple[int, str, str]] = []

    def here(self) -> int:
        return self.org + len(self.buf)

    def label(self, name: str) -> None:
        self.labels[name] = self.here()

    def b(self, *vals: int) -> None:
        for v in vals:
            self.buf.append(v & 0xFF)

    def rel(self, op: int, name: str) -> None:
        self.b(op, 0)
        self.fixups.append((len(self.buf) - 1, name, "rel"))

    def jsr(self, name: str) -> None:
        self.b(0x20)
        self.fixups.append((len(self.buf), name, "abs"))
        self.b(0, 0)

    def jmp(self, name: str) -> None:
        self.b(0x4C)
        self.fixups.append((len(self.buf), name, "abs"))
        self.b(0, 0)

    def lda(self, n: int) -> None:
        self.b(0xA9, n)

    def ldy(self, n: int) -> None:
        self.b(0xA0, n)

    def sta_abs(self, addr: int) -> None:
        self.b(0x8D, addr & 255, addr >> 8)

    def stz_abs(self, addr: int) -> None:
        self.b(0x9C, addr & 255, addr >> 8)

    def lda_abs(self, addr: int) -> None:
        self.b(0xAD, addr & 255, addr >> 8)

    def bit_abs(self, addr: int) -> None:
        self.b(0x2C, addr & 255, addr >> 8)

    def sta_dp(self, addr: int) -> None:
        self.b(0x85, addr)

    def lda_dp(self, addr: int) -> None:
        self.b(0xA5, addr)

    def stz_dp(self, addr: int) -> None:
        self.b(0x64, addr)

    def cmp_i(self, n: int) -> None:
        self.b(0xC9, n)

    def and_i(self, n: int) -> None:
        self.b(0x29, n)

    def rts(self) -> None:
        self.b(0x60)

    def resolve(self) -> None:
        for pos, name, kind in self.fixups:
            addr = self.labels[name]
            if kind == "abs":
                self.buf[pos] = addr & 255
                self.buf[pos + 1] = (addr >> 8) & 255
            else:
                pc = self.org + pos + 1
                rel = addr - pc
                if not -128 <= rel <= 127:
                    raise SystemExit(f"branch to {name} is {rel} bytes")
                self.buf[pos] = rel & 255


def color_bytes(value: int) -> tuple[int, int]:
    return value & 255, (value >> 8) & 255


def emit_color(a: Asm, value: int) -> None:
    lo, hi = color_bytes(value)
    a.lda(lo)
    a.sta_abs(0x2122)
    a.lda(hi)
    a.sta_abs(0x2122)


def emit_palette(a: Asm, index: int, colors: list[int]) -> None:
    a.lda(index)
    a.sta_abs(0x2121)
    for c in colors:
        emit_color(a, c)


def emit_dma(a: Asm, vram_word: int, src: int, size: int) -> None:
    a.lda(0x80)
    a.sta_abs(0x2115)
    a.lda(vram_word & 255)
    a.sta_abs(0x2116)
    a.lda((vram_word >> 8) & 255)
    a.sta_abs(0x2117)
    a.lda(0x01)
    a.sta_abs(0x4300)
    a.lda(0x18)
    a.sta_abs(0x4301)
    a.lda(src & 255)
    a.sta_abs(0x4302)
    a.lda((src >> 8) & 255)
    a.sta_abs(0x4303)
    a.lda((src >> 16) & 255)
    a.sta_abs(0x4304)
    a.lda(size & 255)
    a.sta_abs(0x4305)
    a.lda((size >> 8) & 255)
    a.sta_abs(0x4306)
    a.lda(0x01)
    a.sta_abs(0x420B)


def build_tiles() -> tuple[bytes, bytes, bytes, dict[str, int]]:
    letters = list(" XDRUIEAGKNSVY")
    ids = {ch: 8 + i for i, ch in enumerate(letters)}
    tiles = [
        tile2(solid(0)),
        tile2(grass()),
        tile2(path()),
        tile2(pond()),
        tile2(seal()),
        tile2(gate("1")),
        tile2(gate("1")),
        tile2(fence()),
    ]
    for ch in letters:
        tiles.append(tile2(glyph(FONT[ch])))
    raw = b"".join(tiles)
    if len(tiles) != 22 or len(raw) != 22 * 16:
        raise SystemExit(f"expected 22 tiles, got {len(tiles)}")
    names = {
        "blank": 0,
        "grass": 1,
        "path": 2,
        "pond": 3,
        "seal": 4,
        "west": 5,
        "east": 6,
        "fence": 7,
        "letters": ids,
    }
    return raw, tile4(DRUID), b"", names


def tile_entry(tile: int, palette: int) -> int:
    return tile | (palette << 10)


def build_map(names: dict) -> bytes:
    letters: dict[str, int] = names["letters"]
    w, h = 32, 32
    grid = [[tile_entry(names["grass"], 0) for _ in range(w)] for _ in range(h)]
    for x in range(w):
        grid[0][x] = tile_entry(names["fence"], 0)
        grid[27][x] = tile_entry(names["fence"], 0)
    for y in range(28):
        grid[y][0] = tile_entry(names["fence"], 0)
        grid[y][31] = tile_entry(names["fence"], 0)
    for y in range(4, 8):
        for x in range(13, 19):
            grid[y][x] = tile_entry(names["pond"], 0)
    for x in range(1, 31):
        grid[14][x] = tile_entry(names["path"], 0)
    for y in range(11, 17):
        grid[y][2] = tile_entry(names["west"], 1)
        grid[y][29] = tile_entry(names["east"], 2)
    for y in range(18, 22):
        for x in range(14, 18):
            grid[y][x] = tile_entry(names["seal"], 2)
    title = "XDRUID I"
    for i, ch in enumerate(title):
        grid[2][12 + i] = tile_entry(letters[ch], 3)
    for i, ch in enumerate("NARAKA"):
        grid[25][2 + i] = tile_entry(letters[ch], 1)
    for i, ch in enumerate("SVARGA"):
        grid[25][23 + i] = tile_entry(letters[ch], 2)
    out = bytearray()
    for y in range(h):
        for x in range(w):
            out += struct.pack("<H", grid[y][x])
    return bytes(out)


def assemble(green: int, red: int, gold: int, tile_bytes: int) -> bytes:
    a = Asm()
    a.b(0x78, 0x18, 0xFB)  # sei clc xce
    a.b(0xC2, 0x30)  # rep #$30
    a.b(0xA9, 0x00, 0x00)  # lda #$0000
    a.b(0x5B)  # tcd
    a.b(0xA9, 0xFF, 0x01)  # lda #$01FF
    a.b(0x1B)  # tcs
    a.b(0xE2, 0x30)  # sep #$30
    a.lda(0x8F)
    a.sta_abs(0x2100)
    a.stz_abs(0x4200)
    a.lda(0x01)
    a.sta_abs(0x2101)  # sprites at VRAM word $2000
    a.stz_abs(0x2105)  # mode 0, 2bpp backgrounds
    a.stz_abs(0x2106)
    a.stz_abs(0x2107)  # BG1 map at $0000
    a.lda(0x01)
    a.sta_abs(0x210B)  # BG1 tiles at $1000
    a.lda(0x11)
    a.sta_abs(0x212C)  # BG1 + sprites
    a.stz_abs(0x212D)
    black = bgr(0, 0, 0)
    tan = bgr(22, 16, 8)
    blue = bgr(8, 16, 26)
    white = bgr(31, 31, 31)
    emit_palette(a, 0, [bgr(1, 3, 2), green, tan, blue])
    emit_palette(a, 4, [black, red, bgr(12, 2, 2), black])
    emit_palette(a, 8, [black, gold, bgr(31, 30, 22), bgr(16, 10, 4)])
    emit_palette(a, 12, [black, white, gold, black])
    emit_palette(a, 128, [black, black, bgr(28, 18, 12), bgr(10, 18, 12), gold, green, white, tan])
    emit_dma(a, 0x1000, 0x009000, tile_bytes)
    emit_dma(a, 0x0000, 0x009400, 32 * 32 * 2)
    emit_dma(a, 0x2000, 0x00B400, 32)
    # Hide every sprite, then the loop places the druid.
    a.stz_abs(0x2102)
    a.stz_abs(0x2103)
    a.ldy(128)
    a.label("hide")
    a.stz_abs(0x2104)
    a.lda(0xF0)
    a.sta_abs(0x2104)
    a.stz_abs(0x2104)
    a.stz_abs(0x2104)
    a.b(0x88)  # dey
    a.rel(0xD0, "hide")
    a.ldy(32)
    a.label("hi")
    a.stz_abs(0x2104)
    a.b(0x88)
    a.rel(0xD0, "hi")
    a.lda(120)
    a.sta_dp(0x10)
    a.lda(112)
    a.sta_dp(0x11)
    a.stz_dp(0x12)
    a.lda(0xFF)
    a.sta_dp(0x13)
    a.lda(0x0F)
    a.sta_abs(0x2100)
    a.label("main")
    a.jsr("wait")
    a.jsr("pad")
    a.jsr("move")
    a.jsr("paint")
    a.jsr("who")
    a.jmp("main")

    a.label("wait")
    a.label("wait1")
    a.bit_abs(0x4212)
    a.rel(0x30, "wait1")
    a.label("wait2")
    a.bit_abs(0x4212)
    a.rel(0x10, "wait2")
    a.rts()

    a.label("pad")
    a.lda(1)
    a.sta_abs(0x4016)
    a.stz_abs(0x4016)
    a.stz_dp(0x14)
    a.ldy(8)
    a.label("pbit")
    a.lda_abs(0x4016)
    a.b(0x4A)  # lsr
    a.b(0x26, 0x14)  # rol $14
    a.b(0x88)
    a.rel(0xD0, "pbit")
    a.rts()

    def axis(mask: int, addr: int, limit: int, dec: bool, skip: str) -> None:
        a.lda_dp(0x14)
        a.and_i(mask)
        a.rel(0xF0, skip)
        a.lda_dp(addr)
        if dec:
            a.cmp_i(limit + 1)
            a.rel(0x90, skip)
            a.b(0xC6, addr)
        else:
            a.cmp_i(limit)
            a.rel(0xB0, skip)
            a.b(0xE6, addr)
        a.label(skip)

    a.label("move")
    axis(0x08, 0x11, 32, True, "no_up")
    axis(0x04, 0x11, 188, False, "no_down")
    axis(0x02, 0x10, 24, True, "no_left")
    axis(0x01, 0x10, 216, False, "no_right")
    a.rts()

    a.label("paint")
    a.stz_abs(0x2102)
    a.stz_abs(0x2103)
    a.lda_dp(0x10)
    a.sta_abs(0x2104)
    a.lda_dp(0x11)
    a.sta_abs(0x2104)
    a.stz_abs(0x2104)
    a.lda(0x20)
    a.sta_abs(0x2104)
    a.rts()

    a.label("who")
    a.lda_dp(0x10)
    a.cmp_i(40)
    a.rel(0x90, "west")
    a.cmp_i(200)
    a.rel(0xB0, "east")
    a.lda(0)
    a.rel(0x80, "setr")
    a.label("west")
    a.lda(1)
    a.rel(0x80, "setr")
    a.label("east")
    a.lda(2)
    a.label("setr")
    a.cmp_i(0)  # placeholder replaced below — compare to previous realm
    # cmp $13 is C5 13
    a.buf[-2] = 0xC5
    a.buf[-1] = 0x13
    a.rel(0xF0, "same")
    a.sta_dp(0x12)
    a.sta_dp(0x13)
    a.lda(1)
    a.sta_abs(0x2121)
    a.lda_dp(0x12)
    a.cmp_i(1)
    a.rel(0xF0, "red")
    a.cmp_i(2)
    a.rel(0xF0, "gold")
    emit_color(a, green)
    a.rts()
    a.label("red")
    emit_color(a, red)
    a.rts()
    a.label("gold")
    emit_color(a, gold)
    a.label("same")
    a.rts()

    a.resolve()
    return bytes(a.buf)


def checksum(rom: bytearray) -> None:
    rom[0x7FDC:0x7FE0] = b"\xff\xff\x00\x00"
    total = sum(rom) & 0xFFFF
    rom[0x7FDC] = (total ^ 0xFFFF) & 255
    rom[0x7FDD] = ((total ^ 0xFFFF) >> 8) & 255
    rom[0x7FDE] = total & 255
    rom[0x7FDF] = (total >> 8) & 255


def header(rom: bytearray) -> None:
    title = b"XDRUID I"
    rom[0x7FC0:0x7FD5] = title + bytes(21 - len(title))
    rom[0x7FD5] = 0x20  # LoROM
    rom[0x7FD6] = 0x00
    rom[0x7FD7] = 0x05  # 32 KB
    rom[0x7FD8] = 0x00
    rom[0x7FD9] = 0x01  # USA
    rom[0x7FDB] = 0x00
    rom[0x7FFC] = 0x00
    rom[0x7FFD] = 0x80  # reset $8000
    # RTI sits at the first byte after the program; point unused vectors at RESET's RTI later.


def boot_check(code: bytes) -> None:
    rom = bytearray(0x8000)
    rom[: len(code)] = code
    ram = bytearray(0x2000)
    r = {"pc": 0x8000, "a": 0, "x": 0, "y": 0, "sp": 0x1FF, "p": 0x34, "c": 0}
    steps = 0
    vblank_reads = 0
    m8 = True

    def read(addr: int) -> int:
        nonlocal vblank_reads
        addr &= 0xFFFF
        if addr == 0x4212:
            vblank_reads += 1
            return 0x80 if 2 <= (vblank_reads % 6) <= 3 else 0x00
        if addr == 0x4016:
            return 0
        if addr < 0x2000:
            return ram[addr]
        if addr >= 0x8000:
            return rom[addr - 0x8000]
        return 0

    def write(addr: int, val: int) -> None:
        addr &= 0xFFFF
        val &= 0xFF
        if addr < 0x2000:
            ram[addr] = val

    while steps < 250000:
        steps += 1
        pc = r["pc"]
        op = read(pc)
        if op == 0x78:  # sei
            r["pc"] = pc + 1
        elif op == 0x18:
            r["c"] = 0
            r["pc"] = pc + 1
        elif op == 0xFB:  # xce
            r["native"] = True
            r["pc"] = pc + 1
        elif op == 0xC2:  # rep
            if read(pc + 1) & 0x20:
                m8 = False
            r["pc"] = pc + 2
        elif op == 0xE2:  # sep
            if read(pc + 1) & 0x20:
                m8 = True
            r["pc"] = pc + 2
        elif op == 0xA9:
            r["a"] = read(pc + 1)
            r["pc"] = pc + (2 if m8 else 3)
        elif op == 0xA0:
            r["y"] = read(pc + 1)
            r["pc"] = pc + 2
        elif op == 0xA5:
            r["a"] = read(read(pc + 1))
            r["pc"] = pc + 2
        elif op == 0x85:
            write(read(pc + 1), r["a"])
            r["pc"] = pc + 2
        elif op == 0x64:
            write(read(pc + 1), 0)
            r["pc"] = pc + 2
        elif op == 0xAD:
            r["a"] = read(read(pc + 1) | (read(pc + 2) << 8))
            r["pc"] = pc + 3
        elif op == 0x8D:
            write(read(pc + 1) | (read(pc + 2) << 8), r["a"])
            r["pc"] = pc + 3
        elif op == 0x9C:
            write(read(pc + 1) | (read(pc + 2) << 8), 0)
            r["pc"] = pc + 3
        elif op == 0x2C:
            val = read(read(pc + 1) | (read(pc + 2) << 8))
            r["p"] = (r["p"] & ~0x80) | (val & 0x80)
            r["pc"] = pc + 3
        elif op == 0x29:
            r["a"] &= read(pc + 1)
            r["p"] = (r["p"] & ~2) | (2 if r["a"] == 0 else 0)
            r["pc"] = pc + 2
        elif op == 0xC9:
            diff = r["a"] - read(pc + 1)
            r["c"] = 1 if r["a"] >= read(pc + 1) else 0
            r["p"] = (r["p"] & ~2) | (2 if (diff & 255) == 0 else 0)
            r["pc"] = pc + 2
        elif op == 0xC5:
            other = read(read(pc + 1))
            r["c"] = 1 if r["a"] >= other else 0
            r["p"] = (r["p"] & ~2) | (2 if r["a"] == other else 0)
            r["pc"] = pc + 2
        elif op == 0x4A:
            r["c"] = r["a"] & 1
            r["a"] = (r["a"] >> 1) & 0xFF
            r["pc"] = pc + 1
        elif op == 0x26:
            addr = read(pc + 1)
            val = read(addr)
            bit = 1 if val & 0x80 else 0
            val = ((val << 1) | r["c"]) & 0xFF
            r["c"] = bit
            write(addr, val)
            r["pc"] = pc + 2
        elif op == 0x88:
            r["y"] = (r["y"] - 1) & 0xFF
            r["p"] = (r["p"] & ~2) | (2 if r["y"] == 0 else 0)
            r["pc"] = pc + 1
        elif op == 0xE6:
            addr = read(pc + 1)
            val = (read(addr) + 1) & 0xFF
            write(addr, val)
            r["pc"] = pc + 2
        elif op == 0xC6:
            addr = read(pc + 1)
            val = (read(addr) - 1) & 0xFF
            write(addr, val)
            r["pc"] = pc + 2
        elif op == 0x5B or op == 0x1B:
            r["pc"] = pc + 1
        elif op in (0x10, 0x30, 0x90, 0xB0, 0xD0, 0xF0, 0x80):
            rel = read(pc + 1)
            if rel >= 128:
                rel -= 256
            take = {
                0x80: True,
                0xF0: bool(r["p"] & 2),
                0xD0: not (r["p"] & 2),
                0x30: bool(r["p"] & 0x80),
                0x10: not (r["p"] & 0x80),
                0xB0: bool(r["c"]),
                0x90: not r["c"],
            }[op]
            r["pc"] = pc + 2 + (rel if take else 0)
        elif op == 0x20:
            ret = (pc + 3) & 0xFFFF
            write(r["sp"], ret >> 8)
            r["sp"] = (r["sp"] - 1) & 0xFFFF
            write(r["sp"], ret & 255)
            r["sp"] = (r["sp"] - 1) & 0xFFFF
            r["pc"] = read(pc + 1) | (read(pc + 2) << 8)
        elif op == 0x60:
            r["sp"] = (r["sp"] + 1) & 0xFFFF
            lo = read(r["sp"])
            r["sp"] = (r["sp"] + 1) & 0xFFFF
            hi = read(r["sp"])
            r["pc"] = ((hi << 8) | lo) & 0xFFFF
        elif op == 0x4C:
            r["pc"] = read(pc + 1) | (read(pc + 2) << 8)
            if ram[0x10] == 120 and ram[0x11] == 112:
                return
        elif op == 0xA9:
            raise SystemExit("lda immediate fell through")
        else:
            raise SystemExit(f"unhandled opcode ${op:02X} at ${pc:04X}")
    raise SystemExit("cartridge did not reach the walk loop")


def main() -> None:
    green = bgr(6, 22, 8)
    red = bgr(22, 4, 4)
    gold = bgr(28, 22, 6)
    tiles, sprite, _, names = build_tiles()
    if len(tiles) != 22 * 16:
        raise SystemExit(f"tile bytes {len(tiles)}")
    game_map = build_map(names)
    if len(game_map) != 2048:
        raise SystemExit("map size")
    code = assemble(green, red, gold, len(tiles))
    if len(code) >= 0x0FFE:
        raise SystemExit(f"code is {len(code)} bytes")
    boot_check(code)
    rom = bytearray(32 * 1024)
    rom[: len(code)] = code
    rom[0x1000: 0x1000 + len(tiles)] = tiles
    rom[0x1400: 0x1400 + len(game_map)] = game_map
    rom[0x3400: 0x3400 + len(sprite)] = sprite
    # RTI for stray interrupts.
    rom[0x0FFE] = 0x40
    header(rom)
    for slot in (0x7FE4, 0x7FE6, 0x7FE8, 0x7FEA, 0x7FEE, 0x7FF4, 0x7FF6, 0x7FF8, 0x7FFA, 0x7FFE):
        rom[slot] = 0xFE
        rom[slot + 1] = 0x8F  # $8FFE
    rom[0x7FFC] = 0x00
    rom[0x7FFD] = 0x80
    checksum(rom)
    OUT.write_bytes(rom)
    print(f"wrote {OUT} ({len(rom)} bytes), code {len(code)} bytes")


if __name__ == "__main__":
    main()

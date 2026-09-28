#!/usr/bin/env python3
"""XDruid I — Python sidecar.

A windowed homestead. It is not the browser game. WASD or arrows walk.
The mouse wheel zooms out further, then back in. The goat stays in the
7 by 3 pen on the upper farm. Xiang Su stands on the sidewalk.

    python3 python/xdruid.py
"""

from __future__ import annotations

import tkinter as tk

W, H = 347, 528
LEVELS = (0.2, 0.35, 0.55, 1.0, 1.5, 2.0, 3.0)
PEN = (240, 80, 56, 24)


class Yard:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("XDruid I")
        self.canvas = tk.Canvas(self.root, width=720, height=480, bg="#070b14", highlightthickness=0)
        self.canvas.pack()
        self.keys: set[str] = set()
        self.x, self.y = 172.0, 380.0
        self.zoom_i = LEVELS.index(1.0)
        self.hand_x, self.hand_y = 56.0, 150.0
        self.goat_x, self.goat_y = 268.0, 92.0
        self.hand_i = 0
        self.goat_i = 0
        self.hand_spots = ((56, 150), (118, 150), (164, 140), (90, 132), (200, 140))
        self.goat_spots = ((250, 90), (268, 92), (284, 98), (256, 100))
        self.hand_goal = self.hand_spots[0]
        self.goat_goal = self.goat_spots[0]
        self.root.bind("<KeyPress>", self.down)
        self.root.bind("<KeyRelease>", self.up)
        self.canvas.bind("<MouseWheel>", self.wheel)
        self.canvas.bind("<Button-4>", lambda _e: self.step_zoom(1))
        self.canvas.bind("<Button-5>", lambda _e: self.step_zoom(-1))
        self.canvas.focus_set()
        self.tick()

    def down(self, e: tk.Event) -> None:
        self.keys.add(e.keysym)

    def up(self, e: tk.Event) -> None:
        self.keys.discard(e.keysym)

    def wheel(self, e: tk.Event) -> None:
        self.step_zoom(1 if e.delta > 0 else -1)

    def step_zoom(self, direction: int) -> None:
        self.zoom_i = max(0, min(len(LEVELS) - 1, self.zoom_i + direction))

    def tick(self) -> None:
        dx = dy = 0.0
        if "a" in self.keys or "Left" in self.keys or "A" in self.keys:
            dx -= 1
        if "d" in self.keys or "Right" in self.keys or "D" in self.keys:
            dx += 1
        if "w" in self.keys or "Up" in self.keys or "W" in self.keys:
            dy -= 1
        if "s" in self.keys or "Down" in self.keys or "S" in self.keys:
            dy += 1
        if dx or dy:
            span = (dx * dx + dy * dy) ** 0.5
            step = 2.2
            self.x = min(330, max(16, self.x + dx / span * step))
            self.y = min(510, max(24, self.y + dy / span * step))
        self.wander_hand()
        self.wander_goat()
        self.draw()
        self.root.after(33, self.tick)

    def wander_hand(self) -> None:
        self.seek(self, "hand_x", "hand_y", self.hand_goal, 0.6)
        if abs(self.hand_x - self.hand_goal[0]) < 2 and abs(self.hand_y - self.hand_goal[1]) < 2:
            spots = ((56, 150), (118, 150), (164, 140), (90, 132), (200, 140))
            i = spots.index(self.hand_goal) if self.hand_goal in spots else 0
            self.hand_goal = spots[(i + 1) % len(spots)]

    def wander_goat(self) -> None:
        self.seek(self, "goat_x", "goat_y", self.goat_goal, 0.45)
        px, py, pw, ph = PEN
        self.goat_x = min(px + pw - 8, max(px + 8, self.goat_x))
        self.goat_y = min(py + ph - 4, max(py + 8, self.goat_y))
        if abs(self.goat_x - self.goat_goal[0]) < 2 and abs(self.goat_y - self.goat_goal[1]) < 2:
            spots = ((250, 90), (268, 92), (284, 98), (256, 100))
            i = spots.index(self.goat_goal) if self.goat_goal in spots else 0
            self.goat_goal = spots[(i + 1) % len(spots)]

    @staticmethod
    def seek(body: Yard, xname: str, yname: str, goal: tuple[float, float], speed: float) -> None:
        x = getattr(body, xname)
        y = getattr(body, yname)
        dx, dy = goal[0] - x, goal[1] - y
        dist = (dx * dx + dy * dy) ** 0.5
        if dist < 0.5:
            return
        step = min(speed, dist)
        setattr(body, xname, x + dx / dist * step)
        setattr(body, yname, y + dy / dist * step)

    def draw(self) -> None:
        c = self.canvas
        c.delete("all")
        zoom = LEVELS[self.zoom_i]
        view_h = min(H, 194 / zoom)
        view_w = W
        cw = int(c.winfo_width() or 720)
        ch = int(c.winfo_height() or 480)
        scale = min(cw / view_w, ch / view_h)
        cam_y = min(max(0, H - view_h), max(0, self.y - view_h / 2))
        ox = (cw - view_w * scale) / 2
        oy = (ch - view_h * scale) / 2 - cam_y * scale

        def r(x: float, y: float, w: float, h: float, fill: str) -> None:
            c.create_rectangle(ox + x * scale, oy + y * scale, ox + (x + w) * scale, oy + (y + h) * scale, fill=fill, outline="")

        def dot(x: float, y: float, rad: float, fill: str) -> None:
            c.create_oval(
                ox + (x - rad) * scale,
                oy + (y - rad) * scale,
                ox + (x + rad) * scale,
                oy + (y + rad) * scale,
                fill=fill,
                outline="#1a120c",
            )

        realm = "#1c6b32"
        if self.x < 70:
            realm = "#8a2418"
        elif self.x > 280:
            realm = "#c6a23a"
        r(0, 0, W, 192, realm)
        r(0, 192, W, 40, "#b7a48a")
        r(0, 232, W, 296, "#8d734c")
        r(156, 366, 32, 28, "#e6c86a")
        r(118, 79, 32, 17, "#2a6a88")
        r(240, 80, 56, 24, "#6a8a48")
        c.create_rectangle(
            ox + 240 * scale,
            oy + 80 * scale,
            ox + 296 * scale,
            oy + 104 * scale,
            outline="#3a2a16",
            width=max(1, int(scale)),
        )
        r(8, 116, 64, 96, "#5a4030")
        r(275, 116, 64, 96, "#d8c070")
        dot(self.hand_x, self.hand_y, 5, "#c4a574")
        dot(self.goat_x, self.goat_y, 5, "#d8d0c4")
        dot(210, 212, 4, "#e07030")
        dot(self.x, self.y, 6, "#f4e2b0")
        c.create_text(12, 12, anchor="nw", fill="#f4e2b0", text="XDruid I  ·  wheel zooms  ·  WASD walks")

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    Yard().run()

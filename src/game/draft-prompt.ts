import { createServerFn } from "@tanstack/react-start";
import { XDRUID_MANDATE } from "@/game/xdruid-mandate";

export type DraftInput = { note: string; x: number; y: number; w: number; h: number };

function squareLine(input: DraftInput): string {
  const x1 = input.x + input.w;
  const y1 = input.y + input.h;
  return `Locked rectangle: x ${input.x}–${x1}, y ${input.y}–${y1} (${input.w}×${input.h} pixels).`;
}

async function attachedSprites(x: number, y: number, w: number, h: number): Promise<string> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = JSON.parse(await readFile("public/game/sprites/manifest.json", "utf8")) as {
      library?: { id: string; file: string; w: number; h: number }[];
      placed?: { id: string; x: number; y: number }[];
    };
    const hits: string[] = [];
    for (const place of raw.placed ?? []) {
      const def = raw.library?.find((d) => d.id === place.id);
      if (!def) continue;
      const hit = place.x < x + w && place.x + def.w > x && place.y < y + h && place.y + def.h > y;
      if (hit) hits.push(`${def.file} at x ${place.x}, y ${place.y}, ${def.w}×${def.h}, on the 8px grid`);
    }
    if (!hits.length) return "";
    return `Attached sprites, use these files and do not redraw them: ${hits.join("; ")}.\n`;
  } catch {
    return "";
  }
}

export const draftDevPrompt = createServerFn({ method: "POST" })
  .validator((data: DraftInput) => {
    const note = String(data?.note ?? "").trim().slice(0, 4000);
    const nums = [data?.x, data?.y, data?.w, data?.h].map(Number);
    if (!note || nums.some((n) => !Number.isFinite(n))) throw new Error("Need a rectangle and a note.");
    const [x, y, w, h] = nums.map((n) => Math.round(n));
    if (w < 1 || h < 1 || w > 2000 || h > 2000) throw new Error("That rectangle is not usable.");
    return { note, x, y, w, h };
  })
  .handler(async ({ data }): Promise<{ prompt: string }> => {
    const key = process.env.XAI_API_KEY;
    const locked = squareLine(data);
    const attached = await attachedSprites(data.x, data.y, data.w, data.h);
    if (!key) throw new Error("The writer is not available.");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        temperature: 0.45,
        max_tokens: 1600,
        messages: [
          {
            role: "system",
            content: `You are the XDruidi implementation writer for Grok Build. ${XDRUID_MANDATE}`,
          },
          {
            role: "user",
            content: `${locked}\n${attached}The player said exactly this. Elucidate it. Do not shorten it into a pixel recipe:\n${data.note}\nThen implore one improvement of that same place so the homestead gets better without leaving the rectangle. If sprites are attached, use those files on the 8px grid and do not redraw them.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error("The writer did not answer.");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const body = json.choices?.[0]?.message?.content?.trim();
    if (!body) throw new Error("The writer returned nothing.");
    const prompt = body.includes("Locked rectangle:") ? body : `${locked}\n${body}`;
    return { prompt };
  });

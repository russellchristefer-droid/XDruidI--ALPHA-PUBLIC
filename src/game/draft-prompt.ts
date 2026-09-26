import { createServerFn } from "@tanstack/react-start";
import { XDRUID_MANDATE } from "@/game/xdruid-mandate";

export type DraftInput = { note: string; x: number; y: number; w: number; h: number };

function squareLine(input: DraftInput): string {
  const x1 = input.x + input.w;
  const y1 = input.y + input.h;
  return `Locked rectangle: x ${input.x}–${x1}, y ${input.y}–${y1} (${input.w}×${input.h} pixels).`;
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
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: `You are the XDruidi implementation writer for Grok Build. ${XDRUID_MANDATE}`,
          },
          {
            role: "user",
            content: `${locked}\nPlayer note: ${data.note}`,
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

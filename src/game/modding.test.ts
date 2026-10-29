import { describe, it, expect, beforeEach } from "vitest";
import { ContentRegistry, EXTENSION_API_VERSION, type CropDefinition } from "./modding.ts";

describe("ContentRegistry", () => {
  let reg: ContentRegistry;

  beforeEach(() => {
    reg = new ContentRegistry();
  });

  it("accepts a valid crop", () => {
    const crop: CropDefinition = {
      apiVersion: 1,
      id: "pumpkin",
      name: "Pumpkin",
      stages: 5,
      growthSeconds: 120,
      waterRequired: true,
      wiltSeconds: 180,
      productDefId: "pumpkin",
      seedDefId: "seed_pumpkin",
      icon: { sheet: "veg", x: 0, y: 0, w: 32, h: 32 },
      blurb: "test",
    };
    const result = reg.registerCrop(crop);
    expect(result.ok).toBe(true);
    expect(reg.getCrop("pumpkin")?.name).toBe("Pumpkin");
  });

  it("rejects bad id", () => {
    const crop = { apiVersion: 1, id: "Pumpkin!", name: "x", stages: 5, growthSeconds: 1, waterRequired: true, wiltSeconds: 1, productDefId: "a", seedDefId: "b", icon: { sheet: "s", x: 0, y: 0, w: 1, h: 1 }, blurb: "" } as CropDefinition;
    const result = reg.registerCrop(crop);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
  });

  it("quarantines broken JSON", () => {
    const result = reg.loadDefinitionFile("{ broken", "bad-mod");
    expect(result.ok).toBe(false);
    expect(reg.getQuarantined().length).toBe(1);
  });

  it("rejects wrong apiVersion", () => {
    const raw = JSON.stringify({ apiVersion: 99, id: "x", name: "x", stages: 5, growthSeconds: 1, waterRequired: true, wiltSeconds: 1, productDefId: "a", seedDefId: "b", icon: { sheet: "s", x: 0, y: 0, w: 1, h: 1 }, blurb: "" });
    const result = reg.loadDefinitionFile(raw, "future");
    expect(result.ok).toBe(false);
  });

  it("exposes stable version", () => {
    expect(EXTENSION_API_VERSION).toBe(1);
  });
});

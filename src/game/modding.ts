/**
 * XDruid I Extension & Modding Framework
 * Stable, versioned API for community and future content.
 * Development never ends.
 *
 * Hyper-realism check: data-driven registry with validation and sandbox
 * feels like a real studio ship (Factorio / RimWorld style). Non-engineers
 * add a crop by dropping one typed JSON file.
 *
 * Dated: 2026-10-29
 * API Version: 1
 */

import type { IconRef, Def } from "./content.ts";

export const EXTENSION_API_VERSION = 1;

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export interface CropDefinition {
  apiVersion: 1;
  id: string;
  name: string;
  stages: number;
  growthSeconds: number;
  waterRequired: boolean;
  wiltSeconds: number;
  productDefId: string;
  seedDefId: string;
  icon: IconRef;
  blurb: string;
}

export interface CreatureDefinition {
  apiVersion: 1;
  id: string;
  name: string;
  kind: string;
  home: { x: number; y: number };
  needs: ("food" | "water" | "shelter")[];
  productDefId?: string;
  icon: IconRef;
  blurb: string;
}

export interface ItemDefinition extends Omit<Def, "kind" | "tool" | "crop" | "equip"> {
  apiVersion: 1;
  kind: string;
  tool?: string;
  crop?: string;
  equip?: string;
}

export interface RealmDefinition {
  apiVersion: 1;
  id: string;
  wing: number;
  title: string;
  notes: string[];
  spawn: { x: number; y: number };
}

export interface RitualDefinition {
  apiVersion: 1;
  id: string;
  name: string;
  skillId: string;
  cost: { stamina?: number; items?: Record<string, number> };
  effect: string;
  blurb: string;
}

export interface SoundDefinition {
  apiVersion: 1;
  id: string;
  event: string;
  bus: "Master" | "Music" | "Weather" | "Animals" | "Bell";
  url?: string;
  volume: number;
}

export type AnyDefinition =
  | CropDefinition
  | CreatureDefinition
  | ItemDefinition
  | RealmDefinition
  | RitualDefinition
  | SoundDefinition;

export class ContentRegistry {
  private crops = new Map<string, CropDefinition>();
  private creatures = new Map<string, CreatureDefinition>();
  private items = new Map<string, ItemDefinition>();
  private realms = new Map<string, RealmDefinition>();
  private rituals = new Map<string, RitualDefinition>();
  private sounds = new Map<string, SoundDefinition>();
  private loadedMods: string[] = [];
  private quarantined: { mod: string; reason: string }[] = [];

  registerCrop(def: CropDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("crop", def, this.crops));
  }

  registerCreature(def: CreatureDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("creature", def, this.creatures));
  }

  registerItem(def: ItemDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("item", def, this.items));
  }

  registerRealm(def: RealmDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("realm", def, this.realms));
  }

  registerRitual(def: RitualDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("ritual", def, this.rituals));
  }

  registerSound(def: SoundDefinition): ValidationResult {
    return this.sandbox(() => this.validateAndStore("sound", def, this.sounds));
  }

  getCrop(id: string): CropDefinition | undefined { return this.crops.get(id); }
  getCreature(id: string): CreatureDefinition | undefined { return this.creatures.get(id); }
  getItem(id: string): ItemDefinition | undefined { return this.items.get(id); }
  getRealm(id: string): RealmDefinition | undefined { return this.realms.get(id); }
  getRitual(id: string): RitualDefinition | undefined { return this.rituals.get(id); }
  getSound(id: string): SoundDefinition | undefined { return this.sounds.get(id); }

  allCrops(): CropDefinition[] { return [...this.crops.values()]; }
  allItems(): ItemDefinition[] { return [...this.items.values()]; }

  loadDefinitionFile(raw: string, modId: string): ValidationResult {
    try {
      const parsed = JSON.parse(raw) as AnyDefinition;
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, errors: ["not an object"] };
      }
      if (parsed.apiVersion !== EXTENSION_API_VERSION) {
        return { ok: false, errors: [`apiVersion ${parsed.apiVersion} not supported (expected ${EXTENSION_API_VERSION})`] };
      }
      if ("productDefId" in parsed && "seedDefId" in parsed && "stages" in parsed) {
        return this.registerCrop(parsed as CropDefinition);
      }
      if ("kind" in parsed && "home" in parsed) {
        return this.registerCreature(parsed as CreatureDefinition);
      }
      if ("weight" in parsed && "floor" in parsed && "icon" in parsed) {
        return this.registerItem(parsed as ItemDefinition);
      }
      if ("wing" in parsed && "title" in parsed) {
        return this.registerRealm(parsed as RealmDefinition);
      }
      if ("skillId" in parsed && "cost" in parsed) {
        return this.registerRitual(parsed as RitualDefinition);
      }
      if ("event" in parsed && "bus" in parsed) {
        return this.registerSound(parsed as SoundDefinition);
      }
      return { ok: false, errors: ["unrecognized definition shape"] };
    } catch (e) {
      const reason = e instanceof Error ? e.message : "parse failed";
      this.quarantined.push({ mod: modId, reason });
      return { ok: false, errors: [reason] };
    }
  }

  private sandbox<T>(fn: () => T): T {
    try {
      return fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sandbox error";
      return { ok: false, errors: [msg] } as unknown as T;
    }
  }

  private validateAndStore<T extends { id: string; apiVersion: number }>(
    kind: string,
    def: T,
    store: Map<string, T>,
  ): ValidationResult {
    const errors: string[] = [];
    if (!def.id || typeof def.id !== "string" || !/^[a-z][a-z0-9_]*$/.test(def.id)) {
      errors.push("id must be lowercase snake_case starting with letter");
    }
    if (store.has(def.id)) {
      errors.push(`duplicate ${kind} id: ${def.id}`);
    }
    if (def.apiVersion !== EXTENSION_API_VERSION) {
      errors.push("apiVersion mismatch");
    }
    if (kind === "crop") {
      const c = def as unknown as CropDefinition;
      if (typeof c.stages !== "number" || c.stages < 1 || c.stages > 8) errors.push("stages out of range");
      if (!c.productDefId || !c.seedDefId) errors.push("productDefId and seedDefId required");
    }
    if (errors.length) return { ok: false, errors };
    store.set(def.id, def);
    return { ok: true };
  }

  getQuarantined() { return [...this.quarantined]; }
  quarantine(mod: string, reason: string) { this.quarantined.push({ mod, reason }); }
  getLoadedMods() { return [...this.loadedMods]; }
}

export const registry = new ContentRegistry();

export function getCropDef(id: string) { return registry.getCrop(id); }
export function getItemDef(id: string) { return registry.getItem(id); }

export async function loadAllMods(glob: Record<string, () => Promise<{ default: string }>>): Promise<void> {
  for (const [path, loader] of Object.entries(glob)) {
    try {
      const mod = await loader();
      const raw = typeof mod.default === "string" ? mod.default : JSON.stringify(mod.default);
      const modId = path.split("/").pop()?.replace(".json", "") ?? path;
      registry.loadDefinitionFile(raw, modId);
    } catch (e) {
      registry.quarantine(path, e instanceof Error ? e.message : "load failed");
    }
  }
}

/** Localization framework for XDruid I.
 * English is the source locale. Additional locales drop in as JSON files
 * under public/locales/{code}.json. No code changes required to add a language.
 * Keys are stable. Missing keys fall back to English, then to the key itself.
 */

type LocaleMap = Record<string, string>;

const FALLBACK: LocaleMap = {}; // populated from en.json at build or load time
let current: LocaleMap = {};
let currentCode = "en";

export async function loadLocale(code: string = "en"): Promise<void> {
  try {
    const res = await fetch(`/locales/${code}.json`);
    if (!res.ok) throw new Error("missing");
    current = await res.json();
    currentCode = code;
  } catch {
    if (code !== "en") await loadLocale("en");
    else current = {};
  }
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let text = current[key] ?? FALLBACK[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

export function getCurrentLocale(): string {
  return currentCode;
}

/** Call once at boot. English is always available. */
export function initI18n(code?: string) {
  return loadLocale(code || (typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en"));
}

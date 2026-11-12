#!/usr/bin/env node
/**
 * Post-build size budget check for XDruid I production artifacts.
 *
 * Fails the process (exit 1) if the total dist size or any single JS chunk
 * exceeds the locked budgets. Designed to run after `npm run build:ci`.
 *
 * Budgets are conservative for a 16x16 pixel homestead client:
 *   - Total dist/ (excluding source maps if present): 8 MiB
 *   - Largest JS chunk: 1.5 MiB
 *   - Total JS: 4 MiB
 *
 * Tree-shaking is assumed (sideEffects: false + Vite default). This script
 * only verifies the outcome, not the process.
 *
 * Usage: node scripts/check-bundle-size.mjs [dist-dir]
 */
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const TOTAL_BUDGET_BYTES = 8 * 1024 * 1024; // 8 MiB
const JS_BUDGET_BYTES = 4 * 1024 * 1024;     // 4 MiB total JS
const CHUNK_BUDGET_BYTES = 1.5 * 1024 * 1024; // 1.5 MiB largest chunk

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && !entry.name.endsWith(".map")) acc.push(full);
  }
  return acc;
}

function main() {
  const dist = resolve(process.argv[2] || "dist");
  let total = 0;
  let jsTotal = 0;
  let largestChunk = { path: "", size: 0 };

  try {
    const files = walk(dist);
    for (const file of files) {
      const size = statSync(file).size;
      total += size;
      if (file.endsWith(".js") || file.endsWith(".mjs")) {
        jsTotal += size;
        if (size > largestChunk.size) largestChunk = { path: file, size };
      }
    }
  } catch (err) {
    console.error(`[check-bundle-size] cannot read ${dist}:`, err.message);
    process.exit(2);
  }

  const fmt = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`;

  console.log(`[check-bundle-size] total dist: ${fmt(total)} (budget ${fmt(TOTAL_BUDGET_BYTES)})`);
  console.log(`[check-bundle-size] total JS:   ${fmt(jsTotal)} (budget ${fmt(JS_BUDGET_BYTES)})`);
  console.log(`[check-bundle-size] largest JS: ${fmt(largestChunk.size)} ${largestChunk.path.replace(dist, "")} (budget ${fmt(CHUNK_BUDGET_BYTES)})`);

  let failed = false;
  if (total > TOTAL_BUDGET_BYTES) {
    console.error(`[check-bundle-size] FAIL: total exceeds budget`);
    failed = true;
  }
  if (jsTotal > JS_BUDGET_BYTES) {
    console.error(`[check-bundle-size] FAIL: JS total exceeds budget`);
    failed = true;
  }
  if (largestChunk.size > CHUNK_BUDGET_BYTES) {
    console.error(`[check-bundle-size] FAIL: largest chunk exceeds budget`);
    failed = true;
  }

  if (failed) process.exit(1);
  console.log("[check-bundle-size] PASS");
}

main();

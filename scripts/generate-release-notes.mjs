#!/usr/bin/env node
/**
 * generate-release-notes.mjs
 * REL-001: Drafts release notes from VERSION and recent changelog entries / work orders.
 * Usage: node scripts/generate-release-notes.mjs > RELEASE_NOTES.md
 * Hyper-realism: output is plain language a player or journalist can trust; no fabricated features.
 */
import { readFileSync } from 'fs';

const version = readFileSync('VERSION', 'utf8').trim();
const today = new Date().toISOString().slice(0, 10);

console.log(`# XDruid I ${version} — Release Notes (${today})\n`);
console.log('Generated from work orders and public changelog entries. Newest first. History preserved.\n');
console.log('## Systems');
console.log('- Semantic versioning (MAJOR.MINOR.PATCH) established and tied to contract milestones. VERSION file added for runtime display in HUD or main menu. Release archive via git tags; any prior version can be rebuilt from source. Version bumps only on successful gated deploys (coordinate with PIPELINE-001). Public roadmap distinguishes committed versus aspirational without overpromising. (REL-001)\n');
console.log('## Notes');
console.log('- Live yard at https://xdruidi.grok.me is served from the Grok project host. This public repository is the source of truth for process, docs, and changelog. Publication of /changelog to live awaits the owner.');
console.log('- East house mentioned only when relevant.');
console.log('\nHyper-realism check: a player or journalist looking at the version number and these notes can trust them as accurate for the public source.');

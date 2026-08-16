#!/usr/bin/env node
// One-time migration: splits the single profile-submission.json array into one
// file per candidate under profiles/, so two candidates never edit the same
// lines and a submission can be validated on its own.
//
// Run once from the repository root:
//
//   node scripts/split-profile-submission.mjs
//
// Duplicate handles keep their first entry, which is the one that was reviewed
// and merged first. Nothing is deleted from profile-submission.json here; that
// file becomes a pointer in the same pull request.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "profile-submission.json"), "utf8"));
const target = join(root, "profiles");
mkdirSync(target, { recursive: true });

const seen = new Map();
const skipped = [];

for (const entry of source.team_profiles) {
  const handle = (entry.github_handle || "").trim();
  if (!handle) {
    skipped.push(`no handle: ${JSON.stringify(entry)}`);
    continue;
  }
  const key = handle.toLowerCase();
  if (seen.has(key)) {
    skipped.push(`duplicate of ${seen.get(key)}: ${handle}`);
    continue;
  }
  seen.set(key, handle);
  const profile = {
    github_handle: handle,
    full_name: (entry.full_name || "").trim(),
    github_trial_issue_link: (entry.github_trial_issue_link || "").trim(),
  };
  writeFileSync(join(target, `${handle}.json`), `${JSON.stringify(profile, null, 2)}\n`);
}

console.log(`Wrote ${seen.size} profiles to profiles/`);
for (const line of skipped) console.log(`  skipped ${line}`);

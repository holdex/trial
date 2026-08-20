// The dropdown a candidate picks from and the labels we file them under are
// two lists that have to stay identical. Adding a role touches both, and a
// position missing from either one is a candidate nobody can find.
//
//   node --test tests/

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { positionLabelMap, labelToPosition } = require(join(root, ".github/workflows/positions.js"));

/** The dropdown options, read straight out of the issue form. */
function dropdownOptions() {
  const form = readFileSync(join(root, ".github/ISSUE_TEMPLATE/job-application.yml"), "utf8");
  const block = form.match(/id: position[\s\S]*?options:\n([\s\S]*?)\n\s*validations:/);
  assert.ok(block, "the application form no longer has a position dropdown");
  return [...block[1].matchAll(/^\s*-\s*"([^"]+)"\s*$/gm)].map((m) => m[1]);
}

test("the form offers exactly the positions we have labels for", () => {
  assert.deepEqual(dropdownOptions(), Object.keys(positionLabelMap));
});

test("every position maps to a usable label", () => {
  for (const [position, label] of Object.entries(positionLabelMap)) {
    assert.match(label, /^position\/[a-z0-9-]+$/, `${position} has an unusable label`);
  }
});

test("no two positions share a label", () => {
  const labels = Object.values(positionLabelMap);
  assert.equal(new Set(labels).size, labels.length);
});

test("a label leads back to the position it came from, and nowhere else", () => {
  assert.deepEqual(
    labelToPosition,
    Object.fromEntries(Object.entries(positionLabelMap).map(([position, label]) => [label, position])),
  );
});

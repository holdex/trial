// The profile check merges the pull request and then hands the candidate their
// trial goal on their application. A token that cannot write issues does the
// first half and fails the second, which leaves a merged profile and a silent
// application. That happened once, so the permission is pinned here.
//
//   node --test tests/

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = readFileSync(join(root, ".github/workflows/validate-profile.yml"), "utf8");

test("the profile check can write the issues it hands over on", () => {
  assert.match(workflow, /^\s{2}issues:\s*write\s*$/m);
});

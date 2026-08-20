// The validator is a script, not a module: it reads the environment and exits
// at load. Starting it is how we find out that everything it imports still
// resolves, which the parse check alone does not tell us.
//
//   node --test tests/

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the validator loads everything it imports", () => {
  let stderr = "";
  let code = 0;
  try {
    execFileSync(process.execPath, [join(root, "scripts/validate-profile.mjs")], {
      env: { PATH: process.env.PATH },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    code = error.status;
    stderr = error.stderr;
  }

  // Reaching the environment check means every import resolved.
  assert.equal(code, 1);
  assert.match(stderr, /GITHUB_TOKEN and PR_NUMBER are both required/);
});

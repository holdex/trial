// A merged pull request reopens the issues its description closes and greets
// their author as a candidate. Reading one number too many once posted "your
// profile PR was merged" on a live application, so the parsing is pinned here.
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
const { linkedIssueNumbers } = require(join(root, ".github/workflows/job-application-reopen.js"));

const linked = (body) => linkedIssueNumbers(body, "holdex", "trial");

test("a closing keyword links the issue it names", () => {
  assert.deepEqual(linked("- Closes #1223"), [1223]);
  assert.deepEqual(linked("Resolves: #7"), [7]);
  assert.deepEqual(linked("CLOSES #9"), [9]);
});

// GitHub closes an issue on `Fixes #1`, and so does the validator's own
// LINK_PATTERN, but this parser reads only `closes` and `resolves`. A profile
// merged by hand rather than by the checks therefore hands over nothing. Pinned
// as it behaves today rather than as it should, so changing it is deliberate.
test("`fixes` closes the issue on GitHub but is invisible here", () => {
  assert.deepEqual(linked("Fixes #42"), []);
});

test("the full URL form links the same issue", () => {
  assert.deepEqual(linked("Closes https://github.com/holdex/trial/issues/1223"), [1223]);
});

test("another repository's issue is not ours to reopen", () => {
  assert.deepEqual(linked("Closes https://github.com/holdex/developers/issues/9"), []);
});

test("a description explaining the syntax closes nothing", () => {
  assert.deepEqual(linked("Put `Closes #1223` in the description."), []);
  assert.deepEqual(linked(["Like this:", "", "```text", "Closes #1223", "```"].join("\n")), []);
});

test("the same issue named twice is reopened once", () => {
  assert.deepEqual(linked("Closes #12\nAlso closes #12"), [12]);
});

test("an empty description links nothing", () => {
  assert.deepEqual(linked(""), []);
  assert.deepEqual(linked(null), []);
});

test("a bare mention is not a promise to close", () => {
  assert.deepEqual(linked("Related to #1223"), []);
});

test("the handover comment leaves no placeholder behind", () => {
  const template = readFileSync(join(root, ".github/workflows/job-application-merged-body.md"), "utf8");
  const body = template.replaceAll("${user}", "enricojr01");
  assert.equal(body.match(/\$\{[a-z_]+\}/g), null);
  assert.match(body, /@enricojr01/);
});

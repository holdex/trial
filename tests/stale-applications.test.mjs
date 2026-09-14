// The follow-up posts on live applications without a person in the loop, so the
// three ways it can land on the wrong candidate are pinned here: following up on
// the backlog it was never meant to touch, closing someone who has a pull
// request, and closing an application on the same day it is first reminded.
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
const { nextStep, STARTS_AT, hasLivePullRequest, remindedAt } = require(join(root, ".github/workflows/stale-applications.js"));

const now = "2026-10-20T00:00:00Z";
const ago = (d) => new Date(Date.parse(now) - d * 86400000).toISOString();

test("an application waits out its first week", () => {
  assert.equal(nextStep({ createdAt: ago(6), hasLinkedPr: false, remindedAt: null, now }), "none");
  assert.equal(nextStep({ createdAt: ago(7), hasLinkedPr: false, remindedAt: null, now }), "remind");
});

test("a linked pull request is never followed up on", () => {
  assert.equal(nextStep({ createdAt: ago(30), hasLinkedPr: true, remindedAt: null, now }), "none");
  assert.equal(nextStep({ createdAt: ago(30), hasLinkedPr: true, remindedAt: ago(20), now }), "none");
});

// 510 of the open applications had no linked pull request when this shipped, 504
// of them over 90 days old and none ever reminded. They are not this workflow's
// to comment on.
test("an application older than the workflow is left alone", () => {
  const before = new Date(Date.parse(STARTS_AT) - 86400000).toISOString();
  assert.equal(nextStep({ createdAt: before, hasLinkedPr: false, remindedAt: null, now }), "none");
  assert.equal(nextStep({ createdAt: STARTS_AT, hasLinkedPr: false, remindedAt: null, now }), "remind");
});

// A run that follows an outage reminds an application well past three weeks old.
// Counting the close from the application rather than the reminder closes it the
// same day it is told it has two weeks.
test("the close is counted from the reminder, not from the application", () => {
  assert.equal(nextStep({ createdAt: ago(35), hasLinkedPr: false, remindedAt: null, now }), "remind");
  assert.equal(nextStep({ createdAt: ago(35), hasLinkedPr: false, remindedAt: now, now }), "none");
  assert.equal(nextStep({ createdAt: ago(35), hasLinkedPr: false, remindedAt: ago(13), now }), "none");
  assert.equal(nextStep({ createdAt: ago(35), hasLinkedPr: false, remindedAt: ago(14), now }), "close");
});

test("a reminded application is closed three weeks after it opened", () => {
  assert.equal(nextStep({ createdAt: ago(21), hasLinkedPr: false, remindedAt: ago(14), now }), "close");
});

// What counts as a submission. A pull request the candidate opened and closed
// themselves would otherwise exempt their application from the follow-up for
// good, and a cross-reference from another repository was never a submission
// here at all.
const xref = (issue) => ({ event: "cross-referenced", source: { issue } });
const here = "holdex/trial";
const pr = (state, merged_at = null, full_name = here) => ({
  state,
  pull_request: { merged_at },
  repository: { full_name },
});

test("an open or merged pull request in this repository is a submission", () => {
  assert.equal(hasLivePullRequest([xref(pr("open"))], here), true);
  assert.equal(hasLivePullRequest([xref(pr("closed", "2026-09-20T00:00:00Z"))], here), true);
});

test("a pull request closed without merging is not one", () => {
  assert.equal(hasLivePullRequest([xref(pr("closed"))], here), false);
});

test("a cross-reference from elsewhere is not one", () => {
  assert.equal(hasLivePullRequest([xref(pr("open", null, "holdex/developers"))], here), false);
  assert.equal(hasLivePullRequest([xref({ state: "open", repository: { full_name: here } })], here), false);
  assert.equal(hasLivePullRequest([{ event: "labeled" }], here), false);
});

// The reminder label survives a close, so an application a person reopens would
// otherwise be closed again on the next run for a reminder it got weeks ago.
test("a reopen starts the reminder over", () => {
  const labeled = { event: "labeled", label: { name: "no-pr-reminded" }, created_at: ago(30) };
  assert.equal(remindedAt([labeled]), ago(30));
  assert.equal(remindedAt([labeled, { event: "closed" }, { event: "reopened" }]), null);
  assert.equal(remindedAt([{ event: "reopened" }, labeled]), ago(30));
});

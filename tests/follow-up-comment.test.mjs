// The one reply a candidate gets is the whole contract, and nothing else
// checks it. These tests render it exactly as the workflow does and hold it to
// what the validator will later demand, so instructions and enforcement cannot
// drift apart without a pull request going red.
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
const { FIELDS, ISSUE_LINK_PATTERN, LINK_PATTERN, TITLE_PATTERN } = require(
  join(root, "scripts/profile-rules.js"),
);
const { renderFollowUp, forkLink, profileLink, field } = require(
  join(root, ".github/workflows/job-application-comment.js"),
);

const REPO = { owner: "holdex", repo: "trial" };
const CANDIDATE = "enricojr01";
const ISSUE = 1223;

const template = readFileSync(join(root, ".github/workflows/job-application-follow-up-body.md"), "utf8");
const render = (overrides = {}) =>
  renderFollowUp(template, {
    repo: REPO,
    candidate: CANDIDATE,
    position: "Python Engineer",
    issueNumber: ISSUE,
    ...overrides,
  });

/** Every markdown link in the rendered comment, as [label, href] pairs. */
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\((https?:[^)]+)\)/g)].map((m) => [m[1], m[2]]);
const linkTo = (body, label) => links(body).find(([text]) => text === label)?.[1];

test("no placeholder survives rendering", () => {
  assert.equal(render().match(/\$\{[a-z_]+\}/g), null);
});

test("the template's own comments leak nothing into the comment", () => {
  const comments = render().match(/<!--[\s\S]*?-->/g) || [];
  for (const comment of comments) {
    assert.doesNotMatch(comment, /https?:\/\//, `an HTML comment carries a link: ${comment}`);
  }
});

test("the editor link opens a repository the candidate can write to", () => {
  const url = new URL(linkTo(render(), "your profile file"));
  assert.equal(url.origin, "https://github.com");
  const [owner, repo, action, branch] = url.pathname.slice(1).split("/");
  assert.equal(owner, CANDIDATE, "the editor has to open on the candidate's own fork");
  assert.equal(repo, REPO.repo);
  assert.equal(action, "new");
  assert.equal(branch, "main");
});

test("the editor link prefills a profile the validator accepts", () => {
  const url = new URL(linkTo(render(), "your profile file"));
  assert.equal(url.searchParams.get("filename"), `profiles/${CANDIDATE}.json`);

  const profile = JSON.parse(url.searchParams.get("value"));
  assert.deepEqual(Object.keys(profile).sort(), [...FIELDS].sort());
  assert.equal(profile.github_handle, CANDIDATE);
  assert.match(profile.github_trial_issue_link, ISSUE_LINK_PATTERN);
  assert.equal(ISSUE_LINK_PATTERN.exec(profile.github_trial_issue_link)[1], String(ISSUE));
});

test("the fork link points at the repository being forked", () => {
  assert.equal(linkTo(render(), "Fork this repository"), `https://github.com/${REPO.owner}/${REPO.repo}/fork`);
  assert.equal(forkLink(REPO), `https://github.com/${REPO.owner}/${REPO.repo}/fork`);
});

test("the title we dictate is the title the validator wants", () => {
  const body = render();
  const title = body.match(/```text\n\s*(chore\(profile\): [^\n]+?)\s*\n\s*```/)?.[1];
  assert.equal(title, `chore(profile): add ${CANDIDATE} profile`);
  assert.match(title, TITLE_PATTERN);
});

test("the closing line we dictate is the one the validator reads", () => {
  const body = render();
  const line = body.match(/```text\n\s*(Closes #\d+)\s*\n\s*```/)?.[1];
  assert.ok(line, "the comment no longer spells out a closing line");
  const closes = LINK_PATTERN.exec(line);
  assert.equal(closes[1] || closes[2], String(ISSUE));
});

test("every link in the comment is one the candidate can open", () => {
  for (const [label, href] of links(render())) {
    assert.doesNotMatch(href, /\$\{/, `${label} still holds a placeholder`);
    assert.doesNotMatch(href, /localhost|example\.com/, `${label} points nowhere real`);
    assert.doesNotThrow(() => new URL(href), `${label} is not a URL`);
  }
});

test("an application with no position still reads as a sentence", () => {
  const body = render({ position: null });
  assert.match(body, /your application for a role at Holdex is live/);
});

test("the position from the issue form reaches the comment", () => {
  const issueBody = [
    "### Application Position",
    "",
    "Python Engineer",
    "",
    "### First Name",
    "",
    "Enrico",
  ].join("\n");
  assert.match(render({ position: field(issueBody, "Application Position") }), /for Python Engineer is live/);
});

// The position is read out of an issue body the candidate wrote, so it reaches
// the renderer as text of their choosing.
test("a value that looks like a placeholder stays text", () => {
  const body = render({ position: "${profile_link}" });
  assert.match(body, /your application for \$\{profile_link\} is live/);
  assert.equal(body.match(/\$\{profile_link\}/g).length, 1, "the value was expanded a second time");
});

test("a value holding a replacement pattern stays text", () => {
  assert.match(render({ position: "$& $` $'" }), /your application for \$& \$` \$' is live/);
});

test("the profile link is built from the candidate, not the repository owner", () => {
  const url = new URL(profileLink(REPO, "someone-else", 7));
  assert.equal(url.pathname, "/someone-else/trial/new/main");
  assert.equal(url.searchParams.get("filename"), "profiles/someone-else.json");
});

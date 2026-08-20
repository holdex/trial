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
const reopen = require(join(root, ".github/workflows/job-application-reopen.js"));
const { linkedIssueNumbers } = reopen;
const { renderHandover } = require(join(root, ".github/workflows/render.js"));
const { CLOSING_KEYWORDS, LINK_PATTERN } = require(join(root, "scripts/profile-rules.js"));

const linked = (body) => linkedIssueNumbers(body, "holdex", "trial");

test("a closing keyword links the issue it names", () => {
  assert.deepEqual(linked("- Closes #1223"), [1223]);
  assert.deepEqual(linked("Resolves: #7"), [7]);
  assert.deepEqual(linked("CLOSES #9"), [9]);
  assert.deepEqual(linked("Fixes #42"), [42]);
});

// A profile that merges on one keyword and hands over on another leaves the
// candidate with a closed application and no trial goal, which is what happened
// while this parser read `closes` and `resolves` and the validator also took
// `fixes`. Both now read the same list.
test("every keyword the validator accepts is one this parser reads", () => {
  for (const keyword of CLOSING_KEYWORDS) {
    const body = `${keyword} #1223`;
    assert.ok(LINK_PATTERN.test(body), `the validator does not accept ${keyword}`);
    assert.deepEqual(linked(body), [1223], `${keyword} hands over nothing`);
  }
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

// Both merge paths render this one through renderHandover: the checks that
// merge on their own, and this job when a person merges by hand.
test("the handover comment leaves no placeholder behind", () => {
  const template = readFileSync(join(root, ".github/workflows/job-application-merged-body.md"), "utf8");
  const body = renderHandover(template, "enricojr01");
  assert.equal(body.match(/\$\{[a-z_]+\}/g), null);
  assert.match(body, /@enricojr01/);
});

test("the merged pull request greets the author of the application it closed", async () => {
  const posted = [];
  const issue = {
    number: 1223,
    labels: [{ name: "job-application" }],
    user: { login: "enricojr01" },
  };
  const github = {
    paginate: async () => [{ filename: "profiles/enricojr01.json" }],
    rest: {
      pulls: { listFiles: "listFiles" },
      issues: {
        get: async () => ({ data: issue }),
        update: async () => ({}),
        createComment: async (args) => posted.push(args),
      },
    },
  };
  const context = {
    repo: { owner: "holdex", repo: "trial" },
    payload: { pull_request: { number: 9, body: "- Closes #1223", user: { login: "enricojr01" } } },
  };

  process.env.GITHUB_WORKSPACE = root;
  await reopen({ github, context, core: { setFailed: (m) => assert.fail(m) } });

  assert.equal(posted.length, 1);
  assert.equal(posted[0].issue_number, 1223);
  assert.match(posted[0].body, /@enricojr01/);
  assert.equal(posted[0].body.match(/\$\{[a-z_]+\}/g), null);
});

test("a pull request that touches no profile greets nobody", async () => {
  const posted = [];
  const github = {
    paginate: async () => [{ filename: "docs/contributing.md" }],
    rest: {
      pulls: { listFiles: "listFiles" },
      issues: {
        get: async () => assert.fail("looked up an issue for an ordinary pull request"),
        update: async () => assert.fail("reopened an issue for an ordinary pull request"),
        createComment: async (args) => posted.push(args),
      },
    },
  };
  const context = {
    repo: { owner: "holdex", repo: "trial" },
    payload: { pull_request: { number: 9, body: "- Closes #1223", user: { login: "zolotokrylin" } } },
  };

  process.env.GITHUB_WORKSPACE = root;
  await reopen({ github, context, core: { setFailed: (m) => assert.fail(m) } });
  assert.deepEqual(posted, []);
});

test("someone else's application is not reopened", async () => {
  const posted = [];
  const github = {
    paginate: async () => [{ filename: "profiles/zolotokrylin.json" }],
    rest: {
      pulls: { listFiles: "listFiles" },
      issues: {
        get: async () => ({
          data: { labels: [{ name: "job-application" }], user: { login: "enricojr01" } },
        }),
        update: async () => assert.fail("reopened an application belonging to someone else"),
        createComment: async (args) => posted.push(args),
      },
    },
  };
  const context = {
    repo: { owner: "holdex", repo: "trial" },
    payload: { pull_request: { number: 9, body: "- Closes #1223", user: { login: "zolotokrylin" } } },
  };

  process.env.GITHUB_WORKSPACE = root;
  await reopen({ github, context, core: { setFailed: (m) => assert.fail(m) } });
  assert.deepEqual(posted, []);
});

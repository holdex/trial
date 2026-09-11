// The Contributors table answers "who is working on this repository", and a
// few decisions keep it from answering something else: profile submissions are
// not contributions to the repository, a reviewer who leaves five comments on
// one pull request reviewed one pull request, a reply on your own pull request
// is not a review of it, a bot is not a contributor, and neither authoring nor
// reviewing crowds the other out of the table.
//
//   node --test tests/

import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { fetchMergedPulls, countReviews, rankContributors } =
  require(join(root, ".github/workflows/readme-update.js"));

const context = { repo: { owner: "holdex", repo: "trial" } };
const T = "2026-01-01T00:00:00Z";

/** Counts in the shape the workflow builds them: login → { count, last }. */
const activity = (entries) =>
  new Map(Object.entries(entries).map(([login, [count, last]]) => [login, { count, last }]));

/** A `pulls.list` that answers with one page and then an empty one. */
const pullsListing = (pulls) => ({
  rest: {
    pulls: {
      list: async ({ page }) => ({ data: page === 1 ? pulls : [] }),
    },
  },
});

/** A `pulls.listReviews` that serves these reviews a hundred to a page. */
const reviewsListing = (reviews) => ({
  rest: {
    pulls: {
      listReviews: async ({ page }) => ({ data: reviews.slice((page - 1) * 100, page * 100) }),
    },
  },
});

const pull = (number, author) => ({ number, user: { login: author }, merged_at: T });

// 163 of the 210 merged pull requests here add a profile file. Counting them
// would print the leaderboard's list of candidates a second time, under a
// heading that promises the people improving the repository.
test("a profile submission is not counted as a contribution", async () => {
  const github = pullsListing([
    { number: 1, title: "chore(profile): add someone profile", merged_at: "2026-01-01T00:00:00Z", user: { login: "candidate" } },
    { number: 2, title: "feat(readme): rank contributors", merged_at: "2026-01-02T00:00:00Z", user: { login: "builder" } },
  ]);

  const merged = await fetchMergedPulls(github, context);

  assert.deepEqual(merged.map((pr) => pr.number), [2]);
});

test("a pull request that closed without merging is not counted", async () => {
  const github = pullsListing([
    { number: 3, title: "feat(readme): abandoned", merged_at: null, user: { login: "builder" } },
    { number: 4, title: "feat(readme): landed", merged_at: "2026-01-02T00:00:00Z", user: { login: "builder" } },
  ]);

  const merged = await fetchMergedPulls(github, context);

  assert.deepEqual(merged.map((pr) => pr.number), [4]);
});

test("five comments on one pull request count as one review", async () => {
  const github = reviewsListing([
    { user: { login: "reviewer" } },
    { user: { login: "reviewer" } },
    { user: { login: "other" } },
  ]);

  const reviewed = await countReviews(github, context, [pull(9, "author")]);

  assert.equal(reviewed.get("reviewer").count, 1);
  assert.equal(reviewed.get("other").count, 1);
});

// A reply in a review thread is stored as a review by whoever wrote it. #1243
// carries four such replies from its own author.
test("an author's replies on their own pull request are not a review", async () => {
  const github = reviewsListing([
    { user: { login: "author" } },
    { user: { login: "reviewer" } },
  ]);

  const reviewed = await countReviews(github, context, [pull(9, "author")]);

  assert.deepEqual([...reviewed.keys()], ["reviewer"]);
});

test("reviews past the first hundred are read", async () => {
  const github = reviewsListing([
    ...Array.from({ length: 100 }, () => ({ user: { login: "early" } })),
    { user: { login: "late" } },
  ]);

  const reviewed = await countReviews(github, context, [pull(9, "author")]);

  assert.equal(reviewed.get("late").count, 1);
});

// coderabbitai[bot] reviews pull requests here and would otherwise sit at the
// top of a table about who is building the repository.
test("a bot is left out of the table", () => {
  const rows = rankContributors(
    activity({ builder: [2, T] }),
    activity({ "coderabbitai[bot]": [40, T], reviewer: [1, T] })
  );

  assert.deepEqual(rows.map((r) => r.login), ["builder", "reviewer"]);
});

test("contributors rank by merged pull requests, then reviews", () => {
  const rows = rankContributors(
    activity({ few: [1, T], many: [5, T] }),
    activity({ none: [9, T], few: [2, T] })
  );

  assert.deepEqual(
    rows.map((r) => [r.login, r.merged, r.reviews]),
    [
      ["many", 5, 0],
      ["few", 1, 2],
      ["none", 0, 9],
    ]
  );
});

// Most people here have merged exactly one pull request, so the tie-break
// decides much of the table. Recent activity answers "who is working on this
// repository"; the alphabet does not.
test("a tie goes to whoever was active most recently", () => {
  const rows = rankContributors(
    activity({ aaron: [1, "2025-03-01T00:00:00Z"], zoe: [1, "2026-03-01T00:00:00Z"] }),
    new Map()
  );

  assert.deepEqual(rows.map((r) => r.login), ["zoe", "aaron"]);
});

// Ranked by merged pull requests and cut at ten, a table full of authors would
// push out someone who only reviewed.
test("a reviewer stays in the table when authors fill the top ten", () => {
  const authors = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`author${i}`, [1, T]]));

  const rows = rankContributors(activity(authors), activity({ reviewer: [3, T] }));

  assert.equal(rows.length, 11);
  assert.equal(rows.at(-1).login, "reviewer");
});

test("someone who only reviewed still appears", () => {
  const rows = rankContributors(new Map(), activity({ reviewer: [3, T] }));

  assert.deepEqual(rows.map((r) => [r.login, r.merged, r.reviews]), [["reviewer", 0, 3]]);
});

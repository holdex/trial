#!/usr/bin/env node
// Decides a candidate's profile pull request without a person in the loop.
// Every check below is something the instructions told them to do, so a
// failure is a real signal and the comment says exactly what to change. All
// green squash merges, which reopens their application with the trial goal.
//
// Runs from .github/workflows/validate-profile.yml on pull_request_target,
// which means the token can write. It never checks out or executes anything
// from the fork: the pull request is read entirely through the API.
//
// Local smoke test against any open pull request:
//
//   GITHUB_TOKEN=$(gh auth token) PR_NUMBER=1140 \
//     node scripts/validate-profile.mjs --dry-run

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import render from "../.github/workflows/render.js";
import rules from "./profile-rules.js";

const { FIELDS, HANDLE_PATTERN, ISSUE_LINK_PATTERN, LINK_PATTERN, TITLE_PATTERN } = rules;

const DRY_RUN = process.argv.includes("--dry-run");
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || "holdex/trial";
const PR_NUMBER = process.env.PR_NUMBER;
const MARKER = "<!-- profile-check -->";

if (!TOKEN || !PR_NUMBER) {
  console.error("Error: GITHUB_TOKEN and PR_NUMBER are both required.");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return { ok: res.ok, status: res.status, body: res.status === 204 ? null : await res.json() };
}

/** A failed check, phrased as the change the candidate has to make. */
const fail = (fix) => ({ ok: false, fix });
const pass = (application) => ({ ok: true, application });

/**
 * Everything the instructions asked for, in the order a candidate would hit
 * it. Returns on the first failure, so they get one thing to fix at a time
 * rather than a wall of red.
 */
async function check(pull, files) {
  const author = pull.user.login;
  const profileFiles = files.filter((f) => f.filename.startsWith("profiles/"));

  if (files.length !== 1) {
    return fail(
      `Your pull request changes ${files.length} files. It must change exactly one: \`profiles/${author}.json\`.`,
    );
  }
  const file = profileFiles[0];
  if (!file) {
    return fail(
      `Your pull request changes \`${files[0].filename}\`. The profile goes in \`profiles/${author}.json\`.`,
    );
  }
  if (file.filename !== `profiles/${author}.json`) {
    return fail(
      `Your file is \`${file.filename}\`. Rename it to \`profiles/${author}.json\`, matching the account opening this pull request.`,
    );
  }

  if (!pull.head.repo) {
    return fail("The branch this pull request came from is gone. Open it again from a fork that still exists.");
  }
  const content = await api(
    `/repos/${pull.head.repo.full_name}/contents/${encodeURIComponent(file.filename)}?ref=${pull.head.sha}`,
  );
  if (!content.ok) {
    return fail("The profile file could not be read. Push it again.");
  }
  let profile;
  try {
    profile = JSON.parse(Buffer.from(content.body.content, "base64").toString("utf8"));
  } catch (error) {
    return fail(`The file is not valid JSON: ${error.message}`);
  }

  const keys = Object.keys(profile);
  const missing = FIELDS.filter((f) => !keys.includes(f));
  const extra = keys.filter((k) => !FIELDS.includes(k));
  if (missing.length || extra.length) {
    return fail(
      `The file must hold exactly \`${FIELDS.join("`, `")}\`.` +
        (missing.length ? ` Missing: \`${missing.join("`, `")}\`.` : "") +
        (extra.length ? ` Remove: \`${extra.join("`, `")}\`.` : ""),
    );
  }
  if (!HANDLE_PATTERN.test(profile.github_handle || "")) {
    return fail("`github_handle` is not a GitHub username.");
  }
  if (profile.github_handle.toLowerCase() !== author.toLowerCase()) {
    return fail(
      `\`github_handle\` says \`${profile.github_handle}\` but this pull request comes from \`${author}\`. They have to match.`,
    );
  }
  if (!(profile.full_name || "").trim()) {
    return fail("`full_name` is empty.");
  }

  const linked = ISSUE_LINK_PATTERN.exec(profile.github_trial_issue_link || "");
  if (!linked) {
    return fail(
      "`github_trial_issue_link` must be the full URL of your application, like `https://github.com/holdex/trial/issues/1234`.",
    );
  }

  if (!TITLE_PATTERN.test(pull.title)) {
    return fail(
      `Rename this pull request to \`chore(profile): add ${author} profile\`. The naming convention is in the [Developer Guidelines](https://github.com/holdex/developers).`,
    );
  }

  const closes = LINK_PATTERN.exec(pull.body || "");
  if (!closes) {
    return fail(
      `Add \`Closes #${linked[1]}\` on a line of its own in the description, so this pull request is linked to your application.`,
    );
  }
  const closesNumber = closes[1] || closes[2];
  if (closesNumber !== linked[1]) {
    return fail(
      `The description closes #${closesNumber} but the profile links to #${linked[1]}. Both must point at your own application.`,
    );
  }

  const found = await api(`/repos/${REPO}/issues/${linked[1]}`);
  if (!found.ok) {
    return fail(`#${linked[1]} is not an issue in this repository.`);
  }
  const application = found.body;
  if (application.pull_request) {
    return fail(`#${linked[1]} is a pull request, not your application.`);
  }
  if (!(application.labels || []).some((l) => l.name === "job-application")) {
    return fail(`#${linked[1]} is not a job application.`);
  }
  if (application.user.login.toLowerCase() !== author.toLowerCase()) {
    return fail(`#${linked[1]} was opened by \`${application.user.login}\`. Link your own application.`);
  }

  return pass(Number(linked[1]));
}

/** One comment per pull request, rewritten rather than repeated. */
async function say(text) {
  const body = `${MARKER}\n${text}`;
  if (DRY_RUN) {
    console.log(body);
    return;
  }
  const existing = await api(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`);
  const mine = existing.ok && existing.body.find((c) => c.body?.startsWith(MARKER));
  const path = mine
    ? `/repos/${REPO}/issues/comments/${mine.id}`
    : `/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const result = await api(path, {
    method: mine ? "PATCH" : "POST",
    body: JSON.stringify({ body }),
  });
  if (!result.ok) throw new Error(`Commenting failed: ${result.status}`);
}

async function main() {
  const pull = (await api(`/repos/${REPO}/pulls/${PR_NUMBER}`)).body;
  if (pull.state !== "open" || pull.draft) {
    console.log("Not an open, ready pull request. Nothing to check.");
    return;
  }

  const files = (await api(`/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`)).body;
  if (!files.some((f) => f.filename.startsWith("profiles/"))) {
    // Someone following an older comment edits the file profiles replaced.
    // Answer them, since silence is what this whole change exists to end.
    if (files.some((f) => f.filename === "profile-submission.json")) {
      console.log("Rejected: submitted to profile-submission.json.");
      await say(
        `**Not merged yet.** Profiles moved to one file per candidate. ` +
          `Put yours in \`profiles/${pull.user.login}.json\` and leave ` +
          "`profile-submission.json` alone. See " +
          "[profiles/README.md](https://github.com/holdex/trial/blob/main/profiles/README.md).",
      );
      process.exitCode = 1;
      return;
    }
    // Anything else is ordinary repository work and none of this check's
    // business.
    console.log("No profile in this pull request. Nothing to check.");
    return;
  }

  const verdict = await check(pull, files);
  if (!verdict.ok) {
    console.log(`Rejected: ${verdict.fix}`);
    await say(
      `**Not merged yet.** ${verdict.fix}\n\n` +
        "Push the correction to this same pull request and it is checked again.\n" +
        "Working this out yourself is the first thing we assess, so we will not change it for you.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Accepted.");
  if (DRY_RUN) return;

  const merged = await api(`/repos/${REPO}/pulls/${PR_NUMBER}/merge`, {
    method: "PUT",
    body: JSON.stringify({
      merge_method: "squash",
      commit_title: `${pull.title} (#${PR_NUMBER})`,
    }),
  });
  if (!merged.ok) {
    await say(
      "**Checks passed, but the merge did not go through.** Someone from the team will finish this by hand.",
    );
    throw new Error(`Merge failed: ${merged.status} ${JSON.stringify(merged.body)}`);
  }
  // Say it only once it is true: claiming the application reopened before the
  // handover has happened leaves the candidate holding a false statement when
  // it fails.
  await handOver(verdict.application, pull.user.login);
  await say("**Merged.** Your application reopens with your trial goal.");
}

/**
 * Reopens the application this pull request closed and posts the trial goal.
 *
 * This has to happen here rather than in the pull_request:closed job, because
 * a merge performed with GITHUB_TOKEN does not start new workflow runs. Left to
 * that job, a submission merged by this script would close the candidate's
 * application and hand them nothing.
 */
async function handOver(issue_number, candidate) {
  const template = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", ".github/workflows/job-application-merged-body.md"),
    "utf8",
  );
  const reopened = await api(`/repos/${REPO}/issues/${issue_number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "open" }),
  });
  // Stop here rather than commenting a trial goal onto an application that is
  // still closed.
  if (!reopened.ok) {
    throw new Error(`Could not reopen #${issue_number}: ${reopened.status}`);
  }
  const commented = await api(`/repos/${REPO}/issues/${issue_number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body: render.renderHandover(template, candidate) }),
  });
  if (!commented.ok) {
    throw new Error(`Handover comment failed: ${commented.status}`);
  }
  console.log(`Handed over the trial goal on #${issue_number}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

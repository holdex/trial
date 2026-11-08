---
name: report-bug
description: Post a `@holdex bug commit` or `@holdex bug dispute` comment on a pull request to attribute the commit and author that introduced a bug. Required for every `fix` PR before it is ready for review.
---

# Report Bug

Post a `@holdex bug commit` or `@holdex bug dispute` comment on a pull request
to attribute the commit and author that introduced a bug.

**Required for every PR whose title starts with `fix` (Conventional Commits
type).** A `fix` PR is not ready for review until this comment is posted — it's
how the original bug source gets attributed.

## Input

`$ARGUMENTS` holds the commit URL and the GitHub handle of the commit's author,
optionally prefixed with `dispute` to correct a previous report instead of
filing a new one:

- `<commit-url> @<github-handle>` — report the commit/author that introduced the
  bug (e.g. `https://github.com/holdex/my-repo/commit/1234567890 @usershandle`).
- `dispute <commit-url> @<github-handle>` — dispute a previous bug report after
  the PR it was filed on has already been merged, to correct an incorrect
  attribution.

If `$ARGUMENTS` is empty, ask the user for the commit URL and the author's
GitHub handle before proceeding.

Determine which mode applies:

- No `dispute` prefix: **report** — attribute the commit/author that introduced
  the bug this PR fixes.
- `dispute` prefix: **dispute** — strip the `dispute` prefix to get the commit
  URL and handle; use this to correct a wrong attribution after merge.

Validate the input against strict patterns — reject anything that doesn't fully
match, don't just check a prefix:

- Commit URL must match
  `^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/(commit|pull/[0-9]+/(commits|changes))/[0-9a-f]{7,40}$`.
- Handle must match `^@[A-Za-z0-9](-?[A-Za-z0-9])*$` (a bare GitHub username,
  `@` + up to 39 alphanumeric/hyphen characters, no spaces or shell
  metacharacters).

If either fails to match, tell the user and stop — don't attempt to sanitize or
partially accept it.

## Resolve the PR

Detect the current PR from the git worktree. **Report** mode targets the PR
still in progress, so open PRs are enough. **Dispute** mode corrects a PR that
"has already been merged" (per its own description above), so the lookup must
include closed/merged PRs too:

```bash
# report
gh pr list --head "$(git branch --show-current)" --json number,url,title --limit 1

# dispute
gh pr list --head "$(git branch --show-current)" --state all --json number,url,title,comments --limit 1
```

If no PR is found for the current branch, ask the user for the PR number or URL.

If the PR title does not start with `fix`, confirm with the user that they still
want to post a bug report comment before continuing — this skill is only
required for `fix` PRs, but can be used on any PR.

For **dispute** mode specifically, before posting: check the resolved PR's
comments for a prior `@holdex bug commit <COMMIT_URL> && bug author <HANDLE>`
comment whose commit URL matches the one given in `$ARGUMENTS` (the handle is
expected to differ — that's the attribution being corrected). Require exactly
one such PR/comment match. If none match, or more than one PR matches the
branch/commit, stop without posting and tell the user why instead of guessing.

## Post the comment

Assign the validated URL, handle, and PR URL to shell variables first, quote
every expansion, and pass the body through `--body-file -` rather than
interpolating them into an inline `--body` string:

Report the commit/author that introduced the bug:

```bash
COMMIT_URL="<commit-url>"
HANDLE="<handle>"
PR_URL="<pr-url>"
gh pr comment "$PR_URL" --body-file - <<EOF
@holdex bug commit $COMMIT_URL && bug author $HANDLE
EOF
```

Dispute a previous bug report:

```bash
COMMIT_URL="<commit-url>"
HANDLE="<handle>"
PR_URL="<pr-url>"
gh pr comment "$PR_URL" --body-file - <<EOF
@holdex bug dispute $COMMIT_URL && bug author $HANDLE
EOF
```

Confirm the comment was posted and show the PR URL.

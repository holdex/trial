---
name: submit-time
description: Post a `@holdex pr submit-time` or `@holdex pr add-time` comment on a pull request to record time spent.
---

# Submit Time

Post a `@holdex pr submit-time` or `@holdex pr add-time` comment on a pull
request to record time spent.

## Input

Time is provided as `$ARGUMENTS` (e.g. `2h30m`, `1h`, `45m`, `1.5h`), optionally
prefixed with `add` to add time on top of a previous submission instead of
replacing it (e.g. `add 1h30m`).

If `$ARGUMENTS` is empty, ask the user for the time before proceeding.

Determine which mode applies:

- No `add` prefix: **submit/update total time** — replaces any previously
  recorded time for this PR with the given value.
- `add` prefix: **add time on top of the previous submission** — strip the `add`
  prefix to get the time value.

Validate the time format — accepted patterns: `15m`, `1h`, `2h30m`, `1.5h`. If
the format is invalid, tell the user and stop.

## Resolve the PR

Detect the current PR from the git worktree:

```bash
gh pr list --head "$(git branch --show-current)" --json number,url,title --limit 1
```

If no PR is found for the current branch, ask the user for the PR number or URL.

## Post the comment

Submit or update total time:

```bash
gh pr comment <PR_URL> --body "@holdex pr submit-time <TIME>"
```

Add time on top of the previous submission:

```bash
gh pr comment <PR_URL> --body "@holdex pr add-time <TIME>"
```

Confirm the comment was posted and show the PR URL.

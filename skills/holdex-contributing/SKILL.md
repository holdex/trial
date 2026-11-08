---
name: holdex-contributing
description: Holdex contributing rules for GitHub issues and PRs. Invoke before creating or updating issues or PRs in any Holdex repository.
---

# Holdex Contributing

All PRs and issues must follow the
[Holdex Contributing Guidelines][contributing].

## Issues

- Name: `Problem: [statement]` — must be a **job story** describing what a
  specific user **cannot do** (the whole title under 65 characters).
  - Good: `employees can't safely handle fund disbursements`
  - Bad: `fund handling issue`
- Link each Problem as a **sub-issue** of its parent Goal issue.
- When referencing other issues or PRs, always use a **list item**, never
  inline:

  ```md
  - <https://github.com/holdex/hr-internal/issues/123>
  ```

## Pull Requests

- **Title**: `type(scope): action` — user-focused, present tense, Conventional
  Commits format.
  - Good: `docs: protect client funds from unauthorized contractor custody`
  - Bad: `Add FUND_HANDLING.md`
- **Scope**: one `type(scope): action`, 3 to 15 minutes of work, per
  [DEV-320][dev-320]. Decompose if larger.
- **`fix` PRs**: must carry a
  `@holdex bug commit <commit-url> && bug author @<handle>` comment attributing
  the commit/author that introduced the bug — use the `/report-bug` skill
  (`/holdex:report-bug` when installed as a Claude Code plugin). Required before
  marking ready for review.
- **Lifecycle** (in order):
  1. Open as a **draft PR** immediately when starting work.
  1. Link to the Problem issue using a closing keyword (`Closes #123`).
  1. Assign yourself.
  1. If the PR title starts with `fix`, post the bug attribution comment
     (`/report-bug`, or `/holdex:report-bug` as a Claude Code plugin).
  1. Resolve all CI checks.
  1. Assign a reviewer when DEV-405 requires a human (a security change, or a
     Spec others work from).
  1. Mark ready for review only when all steps above are done.
- **Do not merge** until agent review is clean and CI passes, per
  [DEV-405][dev-405]. You merge it and own the result.

[contributing]: https://wizard.holdex.io/docs/contributing
[dev-320]: https://wizard.holdex.io/docs/rules/DEV-320
[dev-405]: https://wizard.holdex.io/docs/rules/DEV-405

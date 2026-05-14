# Viral Job Board

## Overview

Each job application is a public GitHub issue. Candidates share their issue URL to collect 👍 reactions from their network. The README surfaces open positions with live applicant counts and a per-role leaderboard ranked by reactions. The more support a candidate collects, the higher they rank and the sooner they get reviewed.

## README

The README is the front-end. It has three dynamic sections maintained by an automated workflow:

**Open Positions** — a table of every role that has at least one applicant, sorted by applicant count:

```markdown
| Role | Applicants |  |
| ---- | ---------- | --- |
| UX/UI Designer | 220 | [Apply →](issue-form-url) |
```

**How to Apply** — step-by-step instructions directing candidates to submit via the issue form, share their link, and collect reactions.

**Leaderboard** — one sub-section per role, showing the top 10 candidates ranked by 👍 reactions:

```markdown
### Full-Stack Engineer
| # | Candidate | Reactions |
|---|-----------|-----------|
| 1 | [HR: Full-Stack Engineer: Name](issue-url) | 24 👍 |
```

Both sections are delimited by HTML marker comments (`<!-- positions-start/end -->`, `<!-- leaderboard-start/end -->`) so the workflow can rewrite them without touching surrounding content.

## Leaderboard workflow

File: `.github/workflows/readme-update.yml` (script: `.github/workflows/readme-update.js`)

**Triggers:** `workflow_dispatch` + schedule (00:00, 08:00, 16:00 UTC daily)

**Steps:**

1. Fetch all open issues labelled `job-application` (paginated, 100/page)
2. Group by `position/*` label; skip issues with no recognised position label
3. Build Open Positions table from group sizes — no reaction fetches at this stage
4. For each role, take the 10 most recent issues (by issue number) and fetch their `+1` reaction counts
5. Sort each group by reactions descending to produce the leaderboard
6. Replace content between marker comments in `README.md`
7. If the README changed, commit it to `main` via `repos.createOrUpdateFileContents` as `github-actions[bot]`; skip commit if unchanged

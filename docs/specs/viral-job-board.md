---
goal: https://github.com/holdex/trial/issues/1170
---

# Viral Job Board

## Problem

Applying for a job is a passive act. A candidate submits their application and disappears into a queue with no way to stand out, no signal of where they rank, and no tool to show the world they are actively looking for their next challenge. Candidates who have built real networks — on X, LinkedIn, or GitHub — have no way to leverage them. Their reputation and reach are invisible to the process. The application form is the finish line when it should be the starting point.

## Overview

Give candidates a public profile they are proud to share and a reason to share it. Each application becomes a live page where the candidate's network can show support through reactions, pushing them up a public leaderboard. The candidate who campaigns hardest signals exactly the trait every early-stage company wants to hire: someone who takes initiative and gets others behind them. The README becomes the front-end: open positions, a live per-role leaderboard ranked by community reactions, and a direct link to apply.

## Scope

**In scope:**

- README redesign: open positions, per-role leaderboard, how-to-apply section
- Scheduled GitHub Actions workflow that rewrites the leaderboard daily from reaction counts on `job-application` issues
- Follow-up bot comment updated to prompt candidates to share their issue URL and rally their network
- Issue template layout improved so each application reads as a clean shareable profile

**Out of scope:**

- External website or custom domain
- Authentication or candidate dashboards
- Paid promotion or advertising
- Storing or exposing candidate contact details publicly

## README structure

```markdown
# Holdex Trial
<one-line pitch>

## Open Positions
| Role | Applicants | Apply |
| ---- | ---------- | ----- |
| Full-Stack Engineer | 143 | [Apply →](issue-form-url) |

## Leaderboard
> Updated daily. Ranked by community reactions on each application.

### Full-Stack Engineer
| # | Candidate | Reactions |
|---|-----------|-----------|
| 1 | [Name](issue-url) | 24 👍 |

## How to apply
1. Open a new issue using the job application form
2. Share your application link to collect community 👍 reactions
3. Top candidates per role are reviewed first
```

## Leaderboard workflow

Triggers: daily schedule + on every `issues` event (opened, reacted).

Steps:

1. Fetch all open `job-application` issues via GitHub API
2. For each issue fetch reaction count (`+1` only)
3. Group by position label, sort descending by reactions, take top 10 per role
4. Rewrite the leaderboard section of `README.md` between marker comments
5. Commit directly to `main` as `chore(readme): update leaderboard`

## Follow-up comment update

Add to `job-application-follow-up-body.md`:

> Your application is now public — share it with your network and ask them to react with 👍. The more support you collect, the higher you rank on the leaderboard and the sooner you get reviewed.
> Your application: https://github.com/holdex/trial/issues/${issue_number}

## Success metric

Average reaction count per application increases week over week, indicating candidates are actively sharing and rallying support.

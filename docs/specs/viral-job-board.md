---
goal: https://github.com/holdex/trial/issues/1170
---

# Viral Job Board

## Follow-up comment

Update `job-application-follow-up-body.md` to prompt the candidate to share
their application and collect reactions:

> Your application is now public —
> share it with your network and ask them to react with 👍.
> The more support you collect,
> the higher you rank on the leaderboard and the sooner you get reviewed.
> Your application: <https://github.com/holdex/trial/issues/${issue_number}>

## Issue template

The application form should read as a clean, shareable public profile.
Review field labels, descriptions,
and ordering so the rendered issue presents the candidate's information clearly
to anyone who lands on it via a shared link.

## Contributors ranking

Add a Contributors section to the README, maintained by the `readme-update`
workflow, showing who has contributed to the repo ranked by activity.

**Data sources:**

- Merged PRs authored (via `pulls.list` with `state: closed`, filter
  `merged_at` not null)
- PR reviews submitted (via `pulls.listReviews`)

**Display:**

```markdown
## Contributors

| # | Contributor | PRs merged | Reviews |
|---|-------------|-----------|---------|
| 1 | [@handle](profile-url) | 4 | 2 |
```

Delimited by `<!-- contributors-start -->` / `<!-- contributors-end -->` marker
comments so the workflow can rewrite the section independently.

## Success metric

Average reaction count per application increases week over week,
indicating candidates are actively sharing and rallying support.

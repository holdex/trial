# Contributing

Follow the
[Holdex contributing guidelines](https://github.com/holdex/developers) for PR
requirements, naming, and review process.

## Project structure

```text
.github/
  ISSUE_TEMPLATE/job-application.yml   — application form (issue template)
  workflows/
    job-application-flow.yml           — triggers on new issues: renames title, assigns labels, posts follow-up comment
    readme-update.yml + .js            — runs 3× daily: rewrites Open Positions and Leaderboard in README.md
docs/
  specs/viral-job-board.md             — unimplemented backlog
  viral-job-board.md                   — shipped behaviour
README.md                              — public-facing front-end, sections managed by readme-update workflow
```

## Making changes

- Bug reports and improvements:
  [open an issue](https://github.com/holdex/trial/issues/new)
- Workflow or template changes: fork the repo, open a PR against `main`

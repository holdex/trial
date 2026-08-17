# Contributing

Follow the
[Holdex contributing guidelines](https://github.com/holdex/developers) for PR
requirements, naming, and review process.

## Project structure

Each workflow is a few lines of YAML that require a `.js` module beside it,
so the logic can be read, linted, and run outside Actions.

```text
.github/
  ISSUE_TEMPLATE/job-application.yml   — application form (issue template)
  workflows/
    job-application-flow.yml           — on a new application, and on any merged PR
    job-application-comment.js         — posts the one instruction comment, labels and renames the issue
    job-application-reopen.js          — on a merged profile PR: reopens the application, hands over the trial goal
    job-application-follow-up-body.md  — the instruction comment, as a template
    job-application-merged-body.md     — the trial goal hand-over comment, as a template
    validate-profile.yml               — checks a profile submission and merges it when it passes
    positions.js                       — the position to label map, shared by every workflow
    readme-update.yml + .js            — runs 3× daily: rewrites Open Positions and Leaderboard in README.md
docs/
  specs/                               — unimplemented backlog
  viral-job-board.md                   — shipped behaviour
profiles/                              — one file per candidate, see profiles/README.md
schema/profile.schema.json             — what a profile must look like
scripts/
  validate-profile.mjs                 — the profile checks, run by validate-profile.yml
  split-profile-submission.mjs         — one-time script: split profile-submission.json into profiles/
  rename-job-application-issues.mjs    — one-time script: backfills title and position labels on existing job-application issues
README.md                              — public-facing front-end, sections managed by readme-update workflow
```

## Making changes

- Bug reports and improvements:
  [open an issue](https://github.com/holdex/trial/issues/new)
- Workflow or template changes: fork the repo, open a PR against `main`

# How the trial runs

Your trial is a Goal, and you run it the way every Goal at Holdex is run.
You are not handed a narrow task and you are not supervised.
You define the Problems under the Goal, propose solutions as pull requests,
and communicate in the open.

Read [What we expect](#what-we-expect) first.
Not following it is the most common reason a contribution is rejected.

## Your Goal

Your application issue names the Goal for the role you applied for,
and links its spec.
Every Goal lives in this repository, labelled with its position:

- <https://github.com/holdex/trial/issues?q=is%3Aissue+label%3A%22type%3A+goal%22>

Goals stay open, because each candidate runs their own copy.
They are edited as the business changes,
so read the spec rather than an old copy of it.

## Setting up

1. [Create](https://github.com/new) a private repository named
   `holdex-trial-{position}`.
1. Open an issue in it with the same name as your Goal, linking the spec.
1. Work there: define Problems under the Goal, and resolve them by pull
   request.
1. When you are ready, invite [@zolotokrylin](https://github.com/zolotokrylin)
   and [@markholdex](https://github.com/markholdex) as collaborators
   if the repository is under your personal account.
   If you created it under an organisation,
   add them as organisation owners instead.
   Tell them in your issue once access is ready.

Some Goals add their own environment or demo conditions.
Those are in the spec.

## What we expect

Break the Goal into Problems before you write any code.
List every barrier between today and what the spec describes,
and nothing the spec does not ask for
([DEV-150](https://wizard.holdex.io/docs/rules/DEV-150)).
Write each Problem so someone non-technical understands it at a glance:
the pain and the direction, not the steps to build it
([DEV-160](https://wizard.holdex.io/docs/rules/DEV-160)).

Solve each Problem with a pull request.
Open it as a draft as soon as you start, linked to its Problem,
so your progress is visible from the first commit
([DEV-360](https://wizard.holdex.io/docs/rules/DEV-360)).
Keep each pull request small: a few minutes of your time, not days
([DEV-320](https://wizard.holdex.io/docs/rules/DEV-320)).
Name it for what a user can now do, as `type(scope): action`
([DEV-340](https://wizard.holdex.io/docs/rules/DEV-340)),
and sign every commit ([DEV-310](https://wizard.holdex.io/docs/rules/DEV-310)).

## How much to do

Do as much as you can.
When you say you are done, we assess what is there.
Most Goals are a few days of work,
and a Goal that is kept stale without notice is closed.

## What is assessed

We keep this simple and look at very little:

1. Whether you hold to the [Code of Conduct](./CODE_OF_CONDUCT.md).
1. Whether you follow [What we expect](#what-we-expect).

What that means in practice is how you organise the Goal,
the Problems you define under it, and the solutions you propose.
The work itself matters less than how you go about it.

## Questions

Ask them in your application issue.

## Changing this repository

Changes to this repository follow [What we expect](#what-we-expect) too.

### Project structure

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

### Making changes

- Bug reports and improvements:
  [open an issue](https://github.com/holdex/trial/issues/new)
- Workflow or template changes: fork the repo, open a PR against `main`

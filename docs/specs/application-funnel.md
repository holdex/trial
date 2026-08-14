---
goal: https://github.com/holdex/trial/issues/1192
---

# Application Funnel

## Overview

A candidate applies through the issue form and is expected to prove,
on their own, that they can open a pull request and follow written instructions
before any team member spends time on them.
Today that proof is blocked by the instructions themselves and by a review queue
that has stalled, so almost nobody reaches the trial.
This spec describes the funnel as a self-service path: one set of instructions,
a submission that needs no local git,
a machine that accepts or rejects the profile in seconds,
and a role-matched trial goal handed over the moment the profile lands.
A human enters only when a candidate has already passed both gates.

## Objective

Raise the share of applicants who reach a trial goal,
without a team member touching an application
before the candidate has proven they can work in GitHub.

## Key results

1. Applicants who open a profile pull request rise from 12.5% to 40%.
1. Profile pull requests are accepted or rejected within an hour with no human
   action, replacing an 18 day median.
1. Candidates whose profile merges and who then start a trial rise from 3% to
   30%.

## User Types

**Candidate**: an applicant who has opened a job application issue and has not
yet been offered a trial.

**Reviewer**: a Holdex team member who assesses trial work.
A reviewer never sees a candidate before both automated gates pass.

## Key Concepts

### The two gates

The first gate is the profile pull request.
It tests one thing: can this person follow written instructions in GitHub.
It is graded by automation only.

The second gate is the trial goal,
which is role specific and graded by a reviewer per [HR-290][hr-290].
Nothing about the second gate is visible or assignable
until the first one passes.

### Trial goals live in the repository

Every open position has a trial goal held in `docs/trial-goals/`,
one file per goal plus an index that maps each `position/*` label to its goal.
A position with no goal file is not advertised, per [HR-100][hr-100].
The goals mirror how the team actually operates: a candidate writes the Goal,
defines the Problems under it, and resolves them by pull request,
following the [Developer Guidelines][guidelines].

## Applying

The candidate submits the issue form and receives exactly one reply.
That reply is the whole contract, and it contains:

1. The single link to the Developer Guidelines that they will be assessed
   against.
1. A one click link that opens their profile file already filled in, so no
   local git, fork, or branch is needed.
1. The exact pull request title to use, and the exact body line that links the
   pull request back to the application.
1. Their public application URL with a prefilled share text.

Nothing in the reply points anywhere the candidate cannot open,
and no second bot repeats or contradicts it.

## Submitting a profile

The candidate adds one file, `profiles/<github-handle>.json`,
holding their handle, full name, and the URL of their application issue.
One file per candidate means two candidates never touch the same lines,
so a profile submission cannot conflict with another.

Within minutes the submission is checked,
and the candidate learns the result in the pull request:

1. The file is at the expected path and is the only file changed.
1. The file is valid JSON and matches the profile schema.
1. The handle in the file is the candidate's own handle.
1. The linked application issue exists, is open, is labelled `job-application`,
   and was opened by the same person.
1. The pull request title follows the naming convention it was given.

When every check passes the pull request merges by itself.
When a check fails the candidate is told which one, and what to change,
in a comment on their own pull request.
They may correct and push as many times as they need.
Failing a check is part of the test,
so no team member intervenes to fix it for them.

## Starting the trial

When the profile merges,
the application reopens and the candidate is handed the trial goal
for the position they applied to, by name and by link,
not a filtered list to browse.
The handover states the working conditions from the goal file:
where the work lives, who to invite as reviewers, and what "done" means.

## Seeing where an application stands

An application carries its stage as a label, set by automation: applied,
profile merged, trial started.
The leaderboard ranks candidates by how far they have moved through the funnel,
with reactions breaking ties,
so the ranking reflects demonstrated effort rather than an empty reaction count.

## Going stale

An application with no linked pull request is reminded once,
and closed after three weeks with the reason `no PR was submitted`,
per [HR-110][hr-110].
A closed application is not a rejection and the candidate is told so.

## Out of scope

1. Assessment of trial work, which stays a human judgement under
   [HR-290][hr-290].
1. Interviews, offers, and onboarding.
1. Any submission channel other than GitHub.

[guidelines]: https://github.com/holdex/developers
[hr-100]: https://github.com/holdex/hr-internal/blob/main/docs/rules/HR-100.md
[hr-110]: https://github.com/holdex/hr-internal/blob/main/docs/rules/HR-110.md
[hr-290]: https://github.com/holdex/hr-internal/blob/main/docs/rules/HR-290.md

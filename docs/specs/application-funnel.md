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
A human enters only once the profile gate has passed.

## Objective

Raise the share of applicants who reach a trial goal,
without a team member touching an application
before the candidate has proven they can work in GitHub.

## Key results

1. Applicants who open a profile pull request rise from 8% to 40%.
1. Every profile pull request gets a result within two working days, against
   a 41-day median today, and within an hour once the checks decide it.
1. Candidates whose profile merges and who then start a trial rise from 1% to
   30%.

Baselines are the measured funnel, rebuilt weekly:

- <https://github.com/holdex/hr-internal/blob/main/docs/reports/application-funnel.md>

## User Types

**Candidate**: an applicant who has opened a job application issue and has not
yet been offered a trial.

**Reviewer**: a Holdex team member who assesses trial work.
A reviewer never sees a candidate before the profile gate passes,
and the trial goal is the first thing they grade.

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

Every open position has a trial goal,
opened as a Goal issue carrying that position's `position/*` label,
with its spec under `docs/specs/`.
The label is what ties a goal to a role,
so a goal without one can never reach a candidate.
A position with no goal is not advertised, per [HR-100][hr-100].
The goals mirror how the team actually operates: a candidate writes the Goal,
defines the Problems under it, and resolves them by pull request,
following the [Developer Guidelines][guidelines].

## Applying

The candidate submits the issue form and receives exactly one reply.
That reply is the whole contract, and it contains:

1. The single link to the Developer Guidelines that they will be assessed
   against.
1. A one-click link that opens their profile file already filled in, so no
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

Those three fields are everything the funnel stores about a candidate.
The repository is public,
opening the pull request is the act of publishing them,
and the record stays for as long as the repository does.
A candidate can have it taken down, by pull request or by asking,
and [HR-310][hr-310] holds what that obliges us to do.

Within minutes the submission is checked,
and the candidate learns the result in the pull request:

1. The file is at the expected path and is the only file changed.
1. The file is valid JSON and matches the profile schema.
1. The handle in the file is the candidate's own handle.
1. The linked application issue exists, is open, is labelled `job-application`,
   and was opened by the same person.
1. The pull request title follows the naming convention it was given.

Two working days is the outer bound the candidate is promised,
and it holds whether the result comes from the checks or from a person.

When every check passes the pull request merges by itself.
When a check fails the candidate is told which one, and what to change,
in a comment on their own pull request.
They may correct and push as many times as they need.
Failing a check is part of the test,
so no team member intervenes to fix it for them.

## Starting the trial

When the profile merges,
the application reopens and the candidate is handed the open goal carrying their
application's `position/*` label, by name and by link, never a filtered list to
browse.
The handover states the working conditions from that goal: where the work lives,
who to invite as reviewers, and what "done" means.
It also gives them the line to post back here when they begin,
which is what puts them in front of a reviewer.

When no open goal carries the label,
or the application carries no `position/*` label at all,
the candidate is told a reviewer will follow up with their goal,
and the application is labelled `review-required`.
The candidate is never sent to an empty list or a dead link,
and the gap lands in a human queue instead of failing silently.

## Seeing where an application stands

An application carries exactly one stage label:

1. `stage/applied`, added when the application is opened.
1. `stage/profile-merged`, added when the profile pull request merges.
1. `stage/trial-claimed`, added when the candidate says so in the application
   issue, in the exact form the handover gave them:
   `trial started: <url of your trial repository>`.
1. `stage/trial-started`, added by a reviewer who has seen the work.

Each transition removes the previous stage label,
so the current stage is readable from the issue alone.
`job-application` is not a stage: it says what the issue is,
and every application keeps it for its whole life.

### Claiming the trial

The claim is the third instruction a candidate is asked to follow exactly,
and it is read the same way as the first two.
Only a comment from the person who opened the application counts,
and only in that form, so ordinary conversation in the thread changes nothing.
The claim is answered in the thread, so the candidate knows it registered.

A claim is not proof.
The work sits in the candidate's own private repository,
which nothing here can read,
so `stage/trial-claimed` says only that they told us.
What it buys them is a reviewer:
the label is the queue a reviewer works through under [HR-290][hr-290],
and the reviewer moves the application to `stage/trial-started`
once there is work to see.

### Ranking

The leaderboard ranks by stage,
counting only the stages this repository can stand behind:
an application opened, a profile merged, a trial confirmed by a reviewer.
A claim on its own lifts nobody above a merged profile,
because a comment costs nothing
and the ranking is meant to show demonstrated work.
Reactions separate candidates who sit at the same stage,
and never move one past another.

## Going stale

An application with no linked pull request is reminded once,
and closed after three weeks with the reason `no PR was submitted`,
per [HR-110][hr-110].
Both the three-week window
and the two-working-day review time are stated to the candidate in the first
reply, so neither arrives as a surprise.
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
[hr-310]: https://github.com/holdex/hr-internal/blob/main/docs/rules/HR-310.md

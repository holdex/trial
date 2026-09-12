// Follows up on applications that never produced a pull request, so the
// reminder and the close in docs/specs/application-funnel.md stop being manual.
//
// Loaded by stale-applications.yml. Two things make this narrower than a stale
// bot: what counts as alive, and how much it may do in one run.
//
// Alive means an open or merged pull request, not recent activity. The first reply
// promises "if no pull request appears within three weeks", and a candidate
// whose profile pull request is open and failing the checks has an application
// with no activity on it at all. A merged profile pull request is a link too,
// so a candidate already working on their trial goal drops out here without a
// label to exempt them.
//
// The backlog is left alone. On 2026-09-12, 510 of the 645 open applications
// had no linked pull request and 504 of those were over 90 days old, none of
// them ever reminded. Following up on applications that opened before this
// shipped means several hundred people hearing from the repository on the same
// day about something they left months ago, so STARTS_AT draws the line and
// what to do with the older ones stays a decision for a person.

const fs = require('fs');
const path = require('path');
const { fill } = require('./render.js');
const { labelToPosition } = require('./positions.js');

// Applications opened before this workflow existed are not followed up on.
const STARTS_AT = '2026-09-12T00:00:00Z';
const REMIND_AFTER_DAYS = 7;
const CLOSE_AFTER_REMINDER_DAYS = 14;
const REMINDED_LABEL = 'no-pr-reminded';
const CAP_PER_RUN = 20;

const days = (from, to) => (Date.parse(to) - Date.parse(from)) / 86400000;

/**
 * What this run owes one application: a reminder, a close, or nothing.
 *
 * The close is counted from the reminder rather than from the application, so
 * the backlog gets the two weeks the reminder promises it instead of being
 * reminded and closed on the same day for being old.
 */
function nextStep({ createdAt, hasLinkedPr, remindedAt, now }) {
  if (Date.parse(createdAt) < Date.parse(STARTS_AT)) return 'none';
  if (hasLinkedPr) return 'none';
  if (remindedAt) {
    return days(remindedAt, now) >= CLOSE_AFTER_REMINDER_DAYS ? 'close' : 'none';
  }
  return days(createdAt, now) >= REMIND_AFTER_DAYS ? 'remind' : 'none';
}

/**
 * Whether a pull request in this repository still stands for the issue.
 *
 * A cross-reference from a fork or another repository is not a submission here,
 * so the repository is checked rather than trusting the event. A pull request
 * the candidate opened and closed themselves does not count: leaving it in
 * would exempt that application from the follow-up permanently. Open counts
 * because it is a submission under review, and merged counts because it is the
 * first gate passed, which is what puts a candidate on their trial goal.
 */
function hasLivePullRequest(events, here) {
  return events.some((event) => {
    if (event.event !== 'cross-referenced') return false;
    const issue = event.source?.issue;
    if (!issue?.pull_request || issue.repository?.full_name !== here) return false;
    return issue.state === 'open' || Boolean(issue.pull_request.merged_at);
  });
}

/** When the reminder label was last added, or null if it is not on the issue. */
function remindedAt(events) {
  let at = null;
  for (const event of events) {
    if (event.event === 'labeled' && event.label?.name === REMINDED_LABEL) at = event.created_at;
    if (event.event === 'unlabeled' && event.label?.name === REMINDED_LABEL) at = null;
  }
  return at;
}

/** One pass over the timeline answers both questions, so it is read once. */
async function readTimeline(github, context, issueNumber) {
  const events = await github.paginate(github.rest.issues.listEventsForTimeline, {
    ...context.repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  const here = `${context.repo.owner}/${context.repo.repo}`;
  return { hasLinkedPr: hasLivePullRequest(events, here), remindedAt: remindedAt(events) };
}

const positionOf = (issue) =>
  labelToPosition[issue.labels.map((l) => l.name).find((l) => l.startsWith('position/'))] ||
  'a role at Holdex';

module.exports = async ({ github, context, core }) => {
  try {
    const template = (name) =>
      fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, '.github/workflows', name), 'utf8');
    const reminderBody = template('stale-application-reminder-body.md');
    const closingBody = template('stale-application-closing-body.md');

    const applications = await github.paginate(github.rest.issues.listForRepo, {
      ...context.repo,
      state: 'open',
      labels: 'job-application',
      per_page: 100,
    });

    // Oldest first, so a capped run always drains the backlog from the end that
    // has waited longest instead of revisiting the same issues every day.
    const oldest = applications
      .filter((issue) => !issue.pull_request && Date.parse(issue.created_at) >= Date.parse(STARTS_AT))
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    const now = new Date().toISOString();
    let acted = 0;
    for (const issue of oldest) {
      if (acted >= CAP_PER_RUN) break;
      // ponytail: the cap rarely binds now that the backlog is out of scope. It
      // stays as the guard for a run that follows a long outage, and can go if
      // the schedule proves reliable.
      const timeline = await readTimeline(github, context, issue.number);
      const step = nextStep({ createdAt: issue.created_at, ...timeline, now });
      if (step === 'none') continue;

      // The author, not the assignee: 175 of the 645 open applications had no
      // assignee on 2026-09-12, and where there was one it was the author.
      const values = { candidate: issue.user.login, position: positionOf(issue) };

      if (step === 'remind') {
        await github.rest.issues.createComment({
          ...context.repo,
          issue_number: issue.number,
          body: fill(reminderBody, values),
        });
        // The label is what stops a second reminder and starts the two weeks,
        // so a run that cannot set it must not leave the comment counted.
        try {
          await github.rest.issues.addLabels({
            ...context.repo,
            issue_number: issue.number,
            labels: [REMINDED_LABEL],
          });
        } catch (error) {
          // The label does not exist until the first reminder goes out.
          if (error.status !== 422) throw error;
          await github.rest.issues.createLabel({ ...context.repo, name: REMINDED_LABEL, color: 'fbca04' });
          await github.rest.issues.addLabels({
            ...context.repo,
            issue_number: issue.number,
            labels: [REMINDED_LABEL],
          });
        }
      } else {
        await github.rest.issues.createComment({
          ...context.repo,
          issue_number: issue.number,
          body: fill(closingBody, values),
        });
        await github.rest.issues.update({
          ...context.repo,
          issue_number: issue.number,
          state: 'closed',
          state_reason: 'not_planned',
        });
      }
      acted += 1;
      console.log(`${step} #${issue.number}`);
    }
    console.log(`${acted} of ${oldest.length} open applications acted on this run.`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports.nextStep = nextStep;
module.exports.STARTS_AT = STARTS_AT;
module.exports.hasLivePullRequest = hasLivePullRequest;
module.exports.REMINDED_LABEL = REMINDED_LABEL;

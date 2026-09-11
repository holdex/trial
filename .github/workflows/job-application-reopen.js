// Hands a candidate their trial goal the moment their profile pull request
// merges, by reopening the application it closed and commenting there.
//
// Loaded by job-application-flow.yml. Everything here is deliberately narrow:
// the job runs on every merged pull request in the repository, so each guard
// below is what stops it from greeting a team member as a candidate or
// reopening a Problem that was just closed.

const fs = require('fs');
const path = require('path');
const { renderHandover } = require('./render.js');
const { CLOSING_KEYWORDS, TITLE_PATTERN } = require('../../scripts/profile-rules.js');

/**
 * Issue numbers a pull request description actually claims to close.
 *
 * Code spans and fenced blocks are stripped first, because a description that
 * explains `Closes #123` is talking about the syntax, not closing #123. That
 * distinction is not academic: a pull request describing this very automation
 * once posted "your profile PR was merged" on a live candidate's application.
 */
function linkedIssueNumbers(body, owner, repo) {
  const prose = (body || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ');
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?:${CLOSING_KEYWORDS.join('|')}):?\\s*(?:#(\\d+)|https:\\/\\/github\\.com\\/${escape(owner)}\\/${escape(repo)}\\/issues\\/(\\d+))`,
    'gmi'
  );
  return [...new Set([...prose.matchAll(pattern)].map((m) => parseInt(m[1] || m[2], 10)))];
}

module.exports = async ({ github, context, core }) => {
  try {
    const pr = context.payload.pull_request;

    // Only a profile submission earns a trial goal. Without this gate every
    // merged pull request runs the rest of this job.
    //
    // The diff alone is not a reliable signal: a candidate whose file already
    // held the right content (say, from an earlier attempt) merges an empty
    // diff, and `listFiles` comes back with nothing touching `profiles/`. The
    // title convention that `validate-profile.mjs` already enforces catches
    // that case without opening the gate to ordinary repository work.
    const files = await github.paginate(github.rest.pulls.listFiles, {
      ...context.repo,
      pull_number: pr.number,
      per_page: 100,
    });
    if (!files.some((f) => f.filename.startsWith('profiles/')) && !TITLE_PATTERN.test(pr.title)) {
      console.log('No profile in this pull request. Nothing to reopen.');
      return;
    }

    const template = fs.readFileSync(
      path.join(process.env.GITHUB_WORKSPACE, '.github/workflows/job-application-merged-body.md'),
      'utf8'
    );

    for (const issue_number of linkedIssueNumbers(pr.body, context.repo.owner, context.repo.repo)) {
      try {
        const { data: issue } = await github.rest.issues.get({ ...context.repo, issue_number });

        // Never touch anything but the author's own application, so linking
        // someone else's issue moves nothing and greets nobody.
        if (!issue.labels.some((l) => l.name === 'job-application')) {
          console.log(`#${issue_number} is not an application. Skipping.`);
          continue;
        }
        if (issue.user.login.toLowerCase() !== pr.user.login.toLowerCase()) {
          console.log(`#${issue_number} belongs to ${issue.user.login}, not ${pr.user.login}. Skipping.`);
          continue;
        }

        await github.rest.issues.update({ ...context.repo, issue_number, state: 'open' });
        await github.rest.issues.createComment({
          ...context.repo,
          issue_number,
          body: renderHandover(template, issue.user.login),
        });
      } catch (error) {
        console.log(`Could not reopen issue #${issue_number}: ${error.message}`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports.linkedIssueNumbers = linkedIssueNumbers;

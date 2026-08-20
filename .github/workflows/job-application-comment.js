// Greets a new application with the one comment a candidate gets: the
// guidelines, a prefilled link that opens their profile file without any git,
// and the exact title and description line to use. Also labels the issue by
// position and renames it from the form fields.
//
// Loaded by job-application-flow.yml. The comment itself lives in
// job-application-follow-up-body.md, so the wording can be changed without
// touching code.

const fs = require('fs');
const path = require('path');
const { positionLabelMap } = require('./positions.js');
const { fill } = require('./render.js');

const field = (body, label) =>
  body.match(new RegExp(`###\\s*${label}\\s*\\n+([^\\n]+)`))?.[1].trim() || null;

/**
 * GitHub opens a new-file editor with this content already typed in, so the
 * candidate never touches git, which matters when most applicants are
 * designers. The editor is addressed on the candidate's own fork: the same URL
 * on this repository only offers a fork button, and that button answers 422
 * because the prefilled query string travels with it.
 */
function profileLink({ owner, repo }, candidate, issueNumber) {
  const template = JSON.stringify(
    {
      github_handle: candidate,
      full_name: 'Your Name',
      github_trial_issue_link: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
    },
    null,
    2
  );
  return (
    `https://github.com/${candidate}/${repo}/new/main` +
    `?filename=${encodeURIComponent(`profiles/${candidate}.json`)}` +
    `&value=${encodeURIComponent(template)}`
  );
}

/** The fork has to exist before the editor link above resolves. */
const forkLink = ({ owner, repo }) => `https://github.com/${owner}/${repo}/fork`;

/**
 * The reply a candidate gets, with every placeholder filled in. Kept separate
 * from the API call so a test can read the exact text we would post.
 */
function renderFollowUp(template, { repo, candidate, position, issueNumber }) {
  return fill(template, {
    candidate,
    position: position || 'a role at Holdex',
    repo: repo.repo,
    fork_link: forkLink(repo),
    profile_link: profileLink(repo, candidate, issueNumber),
    issue_number: issueNumber,
  });
}

module.exports = async ({ github, context, core }) => {
  try {
    const issue = context.payload.issue;
    const candidate = issue.user.login;
    const body = issue.body || '';
    const position = field(body, 'Application Position');

    const template = fs.readFileSync(
      path.join(process.env.GITHUB_WORKSPACE, '.github/workflows/job-application-follow-up-body.md'),
      'utf8'
    );
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: issue.number,
      body: renderFollowUp(template, {
        repo: context.repo,
        candidate,
        position,
        issueNumber: issue.number,
      }),
    });

    const labels = ['job-application'];
    const positionLabel = position && positionLabelMap[position];
    if (positionLabel) labels.push(positionLabel);
    try {
      await github.rest.issues.addLabels({ ...context.repo, issue_number: issue.number, labels });
    } catch (error) {
      // A position label that has never been used does not exist yet.
      if (error.status === 422 && positionLabel) {
        await github.rest.issues.createLabel({ ...context.repo, name: positionLabel, color: '0075ca' });
        await github.rest.issues.addLabels({ ...context.repo, issue_number: issue.number, labels });
      } else {
        console.log(`Could not label #${issue.number}: ${error.message}`);
      }
    }

    const firstName = field(body, 'First Name');
    const lastName = field(body, 'Last Name');
    if (position && firstName && lastName) {
      await github.rest.issues.update({
        ...context.repo,
        issue_number: issue.number,
        title: `HR: ${position}: ${firstName} ${lastName}`,
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports.field = field;
module.exports.forkLink = forkLink;
module.exports.profileLink = profileLink;
module.exports.renderFollowUp = renderFollowUp;

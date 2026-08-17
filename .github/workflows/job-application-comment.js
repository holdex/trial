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

const field = (body, label) =>
  body.match(new RegExp(`###\\s*${label}\\s*\\n+([^\\n]+)`))?.[1].trim() || null;

/**
 * GitHub opens a new-file editor with this content already typed in, forks the
 * repository on save, and offers the pull request. The candidate never touches
 * git, which matters when most applicants are designers.
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
    `https://github.com/${owner}/${repo}/new/main` +
    `?filename=${encodeURIComponent(`profiles/${candidate}.json`)}` +
    `&value=${encodeURIComponent(template)}`
  );
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
      body: template
        .replaceAll('${candidate}', candidate)
        .replaceAll('${position}', position || 'a role at Holdex')
        .replaceAll('${profile_link}', profileLink(context.repo, candidate, issue.number))
        .replaceAll('${issue_number}', issue.number),
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

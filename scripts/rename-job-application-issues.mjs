#!/usr/bin/env node
// One-time script: renames all issues with the job-application label to
// "HR: [position]: [First name] [Last name]" based on form field values.
// Successfully renamed issues get their position label + "job-application".
// Issues with missing data get "review-required".
//
// Usage: node scripts/rename-job-application-issues.mjs [--dry-run]

import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');
const REPO = 'holdex/trial';

const POSITION_LABEL_MAP = {
  'Partner (Entrepreneur in Residence)': 'position/partner',
  'Marketing Maestro (Head of Marketing)': 'position/marketing-maestro',
  'UX/UI Designer': 'position/ux-ui-designer',
  'UX/UI Engineer': 'position/ux-ui-engineer',
  'Full-Stack Engineer': 'position/full-stack-engineer',
  'DevOps Engineer': 'position/devops-engineer',
  'GoLang Engineer': 'position/golang-engineer',
  'Data Scientist': 'position/data-scientist',
  'Python Engineer': 'position/python-engineer',
  'Developer Relations (DevRel)': 'position/devrel',
  'Senior Smart Contract Developer': 'position/smart-contract-developer',
  'Executive Assistent': 'position/executive-assistant',
  'Actuarial Advisor': 'position/actuarial-advisor',
  'Other': 'position/other',
};

function parseField(body, label) {
  const match = body.match(new RegExp(`###\\s*${label}\\s*\\n+([^\\n]+)`));
  return match ? match[1].trim() : null;
}

function ensureLabel(name, color, description = '') {
  try {
    execSync(
      `gh label create ${JSON.stringify(name)} --repo ${REPO} --color ${color} --description ${JSON.stringify(description)} --force`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
  } catch {
    // already exists
  }
}

function addLabels(number, labels) {
  execSync(
    `gh issue edit ${number} --repo ${REPO} --add-label ${labels.map(l => JSON.stringify(l)).join(',')}`,
    { encoding: 'utf8' }
  );
}

// Ensure labels exist before we start
if (!DRY_RUN) {
  console.log('Ensuring labels exist...');
  ensureLabel('review-required', 'e11d48', 'Application is missing required fields');
  for (const label of Object.values(POSITION_LABEL_MAP)) {
    ensureLabel(label, '0075ca');
  }
  console.log('Done.\n');
}

const labelled = JSON.parse(
  execSync(
    `gh issue list --repo ${REPO} --label job-application --json number,title,body,labels --limit 1000`,
    { encoding: 'utf8' }
  )
);

const unlabelled = JSON.parse(
  execSync(
    `gh issue list --repo ${REPO} --search "is:issue state:open -label:job-application -label:trial-task -type:Problem" --json number,title,body,labels --limit 1000`,
    { encoding: 'utf8' }
  )
).filter(i => (i.body || '').includes('### Application Position'));

const seen = new Set(labelled.map(i => i.number));
const issues = [...labelled, ...unlabelled.filter(i => !seen.has(i.number))];

console.log(`Found ${labelled.length} labelled + ${unlabelled.length} unlabelled = ${issues.length} total job application issues\n`);

let renamed = 0;
let flagged = 0;
let alreadyDone = 0;

for (const issue of issues) {
  const position  = parseField(issue.body, 'Application Position');
  const firstName = parseField(issue.body, 'First Name');
  const lastName  = parseField(issue.body, 'Last Name');

  if (!position || !firstName || !lastName) {
    console.log(`#${issue.number} — missing fields, flagging: "${issue.title}"`);
    if (!DRY_RUN) addLabels(issue.number, ['review-required']);
    flagged++;
    continue;
  }

  const newTitle = `HR: ${position}: ${firstName} ${lastName}`;
  const positionLabel = POSITION_LABEL_MAP[position];
  const labelsToAdd = ['job-application', ...(positionLabel ? [positionLabel] : [])];

  if (issue.title === newTitle) {
    console.log(`#${issue.number} — already correct, applying labels: "${newTitle}"`);
    if (!DRY_RUN) addLabels(issue.number, labelsToAdd);
    alreadyDone++;
    continue;
  }

  console.log(`#${issue.number} — "${issue.title}" → "${newTitle}" [${labelsToAdd.join(', ')}]`);

  if (!DRY_RUN) {
    execSync(
      `gh issue edit ${issue.number} --repo ${REPO} --title ${JSON.stringify(newTitle)}`,
      { encoding: 'utf8' }
    );
    addLabels(issue.number, labelsToAdd);
  }

  renamed++;
}

console.log(`\nDone. ${renamed} renamed, ${alreadyDone} already correct, ${flagged} flagged.${DRY_RUN ? ' (dry run)' : ''}`);

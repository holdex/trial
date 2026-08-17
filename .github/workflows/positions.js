// The one place a position is named. The dropdown in
// .github/ISSUE_TEMPLATE/job-application.yml must offer exactly these, and
// adding a role means editing the template and this file, nothing else.

const positionLabelMap = {
  'Partnership Lead': 'position/partnership-lead',
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
  'Executive Assistant': 'position/executive-assistant',
  'Actuarial Advisor': 'position/actuarial-advisor',
  'Other': 'position/other',
};

const labelToPosition = Object.fromEntries(
  Object.entries(positionLabelMap).map(([position, label]) => [label, position])
);

module.exports = { positionLabelMap, labelToPosition };

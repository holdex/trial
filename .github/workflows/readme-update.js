const fs = require('fs');
const path = require('path');

const APPLY_URL = 'https://github.com/holdex/trial/issues/new?template=job-application.yml';
const TOP_N = 10;

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
  Object.entries(positionLabelMap).map(([k, v]) => [v, k])
);

async function fetchAllIssues(github, context) {
  let allIssues = [];
  let page = 1;
  while (true) {
    let data;
    try {
      ({ data } = await github.rest.issues.listForRepo({
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'open',
        labels: 'job-application',
        per_page: 100,
        page,
      }));
    } catch (err) {
      throw new Error(`fetchAllIssues failed on page ${page}: ${err.message}`);
    }
    if (data.length === 0) break;
    allIssues = allIssues.concat(data);
    if (data.length < 100) break;
    page++;
  }
  return allIssues;
}

async function getThumbsUp(github, context, issueNumber) {
  let count = 0, page = 1;
  while (true) {
    let data;
    try {
      ({ data } = await github.rest.reactions.listForIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        per_page: 100,
        page,
      }));
    } catch (err) {
      throw new Error(`getThumbsUp failed for issue #${issueNumber} page ${page}: ${err.message}`);
    }
    count += data.filter(r => r.content === '+1').length;
    if (data.length < 100) break;
    page++;
  }
  return count;
}

module.exports = async ({ github, context, core }) => {
  try {
    const allIssues = await fetchAllIssues(github, context);

    const positionGroups = new Map();
    for (const issue of allIssues) {
      const posLabel = issue.labels.map(l => l.name).find(l => l.startsWith('position/'));
      if (!posLabel || !labelToPosition[posLabel]) continue;
      const group = positionGroups.get(posLabel) || [];
      group.push(issue);
      positionGroups.set(posLabel, group);
    }

    // Open Positions table — counts only, no reaction fetches
    const positionRows = [...positionGroups.entries()]
      .map(([label, issues]) => ({ displayName: labelToPosition[label], count: issues.length }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);

    const positionsTable = [
      '| Role | Applicants |  |',
      '| ---- | ---------- | --- |',
      ...positionRows.map(p => `| ${p.displayName} | ${p.count} | [Apply →](${APPLY_URL}) |`),
    ].join('\n');

    // Leaderboard — fetch reactions only for top-N most recent candidates per role
    const leaderboardBlocks = [];
    for (const [label, issues] of positionGroups.entries()) {
      const displayName = labelToPosition[label];
      const candidates = issues.sort((a, b) => b.number - a.number).slice(0, TOP_N);
      const withReactions = await Promise.all(
        candidates.map(async issue => ({
          issue,
          reactions: await getThumbsUp(github, context, issue.number),
        }))
      );
      const ranked = withReactions.sort((a, b) => b.reactions - a.reactions);
      if (ranked.length > 0) leaderboardBlocks.push({ displayName, ranked });
    }

    leaderboardBlocks.sort((a, b) => a.displayName.localeCompare(b.displayName));

    const leaderboardContent = leaderboardBlocks.map(({ displayName, ranked }) => {
      const rows = ranked.map((e, i) =>
        `| ${i + 1} | [${e.issue.title}](${e.issue.html_url}) | ${e.reactions} 👍 |`
      );
      return [
        `### ${displayName}`, '',
        '| # | Candidate | Reactions |',
        '|---|-----------|-----------|',
        ...rows,
      ].join('\n');
    }).join('\n\n');

    const readmePath = path.join(process.env.GITHUB_WORKSPACE, 'README.md');
    let readme = fs.readFileSync(readmePath, 'utf8');
    const original = readme;

    readme = readme.replace(
      /<!-- positions-start -->[\s\S]*?<!-- positions-end -->/,
      `<!-- positions-start -->\n${positionsTable}\n<!-- positions-end -->`
    );
    readme = readme.replace(
      /<!-- leaderboard-start -->[\s\S]*?<!-- leaderboard-end -->/,
      `<!-- leaderboard-start -->\n${leaderboardContent}\n<!-- leaderboard-end -->`
    );

    if (readme === original) {
      console.log('README unchanged, skipping commit.');
      return;
    }

    const { data: fileData } = await github.rest.repos.getContent({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: 'README.md',
    });

    await github.rest.repos.createOrUpdateFileContents({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: 'README.md',
      message: 'chore(readme): update positions and leaderboard',
      content: Buffer.from(readme).toString('base64'),
      sha: fileData.sha,
      committer: { name: 'github-actions[bot]', email: 'github-actions[bot]@users.noreply.github.com' },
      author: { name: 'github-actions[bot]', email: 'github-actions[bot]@users.noreply.github.com' },
    });
    console.log('README committed to main.');
  } catch (err) {
    core.setFailed(err.message);
  }
};

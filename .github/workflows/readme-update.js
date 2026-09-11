const fs = require('fs');
const path = require('path');

const APPLY_URL = 'https://github.com/holdex/trial/issues/new?template=job-application.yml';
const TOP_N = 10;

// Reviews cost one call per pull request, so the scan stops after this many.
// Profile submissions are filtered out before the count, which leaves far
// fewer than this today — the cap is what keeps a growing repo from paying
// per-pull-request for its whole history.
const REVIEW_SCAN_LIMIT = 100;

const { labelToPosition } = require('./positions.js');
const { TITLE_PATTERN } = require('../../scripts/profile-rules.js');

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

/**
 * Merged pull requests, profile submissions excluded. A profile submission is
 * one file a candidate adds about themselves, and the leaderboard already
 * names those candidates — counting them here would print that same list
 * again instead of the people working on the repository.
 */
async function fetchMergedPulls(github, context) {
  let merged = [];
  let page = 1;
  while (true) {
    let data;
    try {
      ({ data } = await github.rest.pulls.list({
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'closed',
        per_page: 100,
        page,
      }));
    } catch (err) {
      throw new Error(`fetchMergedPulls failed on page ${page}: ${err.message}`);
    }
    if (data.length === 0) break;
    merged = merged.concat(data.filter(pr => pr.merged_at && !TITLE_PATTERN.test(pr.title)));
    if (data.length < 100) break;
    page++;
  }
  return merged;
}

/** Adds one to a login's count and keeps the latest date it was seen at. */
function tally(counts, login, at) {
  const entry = counts.get(login) || { count: 0, last: at };
  entry.count++;
  if (at > entry.last) entry.last = at;
  counts.set(login, entry);
}

/**
 * How many of these pull requests each person reviewed. Someone who leaves
 * five comments on one pull request reviewed one pull request, so reviewers
 * are deduplicated per pull request before counting. A reply in a review
 * thread is stored as a review by whoever wrote it, so the pull request's own
 * author is left out.
 */
async function countReviews(github, context, pulls) {
  const counts = new Map();
  for (const pr of pulls) {
    let reviews = [];
    let page = 1;
    while (true) {
      let data;
      try {
        ({ data } = await github.rest.pulls.listReviews({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pr.number,
          per_page: 100,
          page,
        }));
      } catch (err) {
        throw new Error(`countReviews failed for pull #${pr.number} page ${page}: ${err.message}`);
      }
      reviews = reviews.concat(data);
      if (data.length < 100) break;
      page++;
    }
    const author = pr.user && pr.user.login;
    const reviewers = new Set(reviews.map(r => r.user && r.user.login).filter(login => login && login !== author));
    for (const login of reviewers) tally(counts, login, pr.merged_at);
  }
  return counts;
}

const isBot = login => login.endsWith('[bot]');

/** The TOP_N most active logins in one role, bots left out, ties to the most recent. */
function topLogins(counts) {
  return [...counts]
    .filter(([login]) => !isBot(login))
    .sort(([la, a], [lb, b]) => b.count - a.count || Date.parse(b.last) - Date.parse(a.last) || la.localeCompare(lb))
    .slice(0, TOP_N)
    .map(([login]) => login);
}

/**
 * The rows of the table: the top authors and the top reviewers together, so
 * neither role crowds the other out. Ranked by merged pull requests alone and
 * cut at ten, the table would drop someone who only reviewed below everyone
 * with a single merge. coderabbitai[bot] reviews most pull requests here and is
 * left out, as it would otherwise lead the reviews column.
 */
function rankContributors(authored, reviewed) {
  const none = { count: 0, last: '' };
  return [...new Set([...topLogins(authored), ...topLogins(reviewed)])]
    .map(login => {
      const a = authored.get(login) || none;
      const r = reviewed.get(login) || none;
      return { login, merged: a.count, reviews: r.count, last: a.last > r.last ? a.last : r.last };
    })
    .sort((a, b) => b.merged - a.merged || b.reviews - a.reviews || Date.parse(b.last) - Date.parse(a.last) || a.login.localeCompare(b.login));
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

    // Contributors — merged pull requests come out of the listing for free,
    // reviews cost a call apiece and so are read only for the recent ones.
    const mergedPulls = await fetchMergedPulls(github, context);

    const authored = new Map();
    for (const pr of mergedPulls) {
      const login = pr.user && pr.user.login;
      if (!login) continue;
      tally(authored, login, pr.merged_at);
    }

    const recentlyMerged = [...mergedPulls]
      .sort((a, b) => new Date(b.merged_at) - new Date(a.merged_at))
      .slice(0, REVIEW_SCAN_LIMIT);
    const reviewed = await countReviews(github, context, recentlyMerged);

    const contributors = rankContributors(authored, reviewed);

    const contributorsTable = [
      '| # | Contributor | PRs merged | Reviews (latest 100 PRs) |',
      '|---|-------------|-----------|---------|',
      ...contributors.map((c, i) =>
        `| ${i + 1} | [@${c.login}](https://github.com/${c.login}) | ${c.merged} | ${c.reviews} |`
      ),
    ].join('\n');

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
    readme = readme.replace(
      /<!-- contributors-start -->[\s\S]*?<!-- contributors-end -->/,
      `<!-- contributors-start -->\n${contributorsTable}\n<!-- contributors-end -->`
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

module.exports.fetchMergedPulls = fetchMergedPulls;
module.exports.countReviews = countReviews;
module.exports.rankContributors = rankContributors;

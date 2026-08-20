// Decides which trial goal a merged profile hands over, and renders the
// comment that names it.
//
// Two callers post that comment: scripts/validate-profile.mjs when the bot
// merges the profile, and job-application-reopen.js when a person merges it.
// They reach GitHub through different clients, so each keeps its own API call
// and only the decisions live here. Duplicating the wording across both is
// what left the old template pointing at a dead label query.

const GOAL_LABEL = 'type: goal';

// Applied to the application when no goal matches its position, so the empty
// case reaches a person instead of stopping at a comment nobody reads.
const NEEDS_A_PERSON = 'review-required';

/** The `position/*` label an application carries, or null when it has none. */
function positionLabel(labels) {
  const names = (labels || []).map((l) => (typeof l === 'string' ? l : l.name));
  return names.find((n) => n && n.startsWith('position/')) || null;
}

/**
 * The goal a candidate gets, out of every open goal issue for their position.
 *
 * Lowest number wins. Two candidates applying for the same role a week apart
 * should land on the same goal, and a rule that depends on ordering the API
 * happens to return would not give them that.
 */
function pickGoal(issues) {
  return (issues || [])
    .filter((i) => !i.pull_request)
    .sort((a, b) => a.number - b.number)[0] || null;
}

/**
 * The candidate-facing comment.
 *
 * `repo` is `owner/name`. `goal` is an issue object or null; null is not an
 * error, it is the five roles that have no goal written yet, and the candidate
 * is told a person is coming rather than handed a link to nothing.
 */
function renderHandover(template, { user, repo, goal }) {
  const paragraph = goal
    ? `Your trial goal is [${goal.title}](https://github.com/${repo}/issues/${goal.number}).\n` +
      'Read it, then comment there to say you are starting.'
    : 'We are matching you to a goal for this role and will post it here.\n' +
      'Nothing is needed from you until then.';
  return template
    .replaceAll('${user}', () => user)
    .replaceAll('${goal}', () => paragraph);
}

module.exports = { GOAL_LABEL, NEEDS_A_PERSON, positionLabel, pickGoal, renderHandover };

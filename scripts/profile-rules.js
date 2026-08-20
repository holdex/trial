// What a profile submission has to look like, in one place.
//
// scripts/validate-profile.mjs enforces these against a real pull request,
// .github/workflows/job-application-reopen.js reads the same closing keywords
// out of a description, and the tests check that the instructions we send a
// candidate ask for something the validator accepts. Keeping the rules here is
// what lets all three agree without one holding a copy that drifts.
//
// CommonJS, because the workflow scripts require it and ESM can import it.

/** The three fields a profile holds, and nothing else. */
const FIELDS = ["github_handle", "full_name", "github_trial_issue_link"];

/**
 * The words GitHub itself treats as closing an issue. Anything accepted here
 * has to be understood everywhere, or a candidate merges on one keyword and is
 * handed over on another.
 */
const CLOSING_KEYWORDS = ["closes", "resolves", "fixes"];

/** The naming convention the profile pull request title follows. */
const TITLE_PATTERN = /^chore\(profile\): /;

/** A closing keyword in a pull request description, by number or by URL. */
const LINK_PATTERN = new RegExp(
  `(?:${CLOSING_KEYWORDS.join("|")}):?\\s*(?:#(\\d+)|https:\\/\\/github\\.com\\/holdex\\/trial\\/issues\\/(\\d+))`,
  "i",
);

/** A GitHub username. */
const HANDLE_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** The full URL of an application issue, which is what the profile stores. */
const ISSUE_LINK_PATTERN = /^https:\/\/github\.com\/holdex\/trial\/issues\/(\d+)$/;

module.exports = {
  FIELDS,
  CLOSING_KEYWORDS,
  TITLE_PATTERN,
  LINK_PATTERN,
  HANDLE_PATTERN,
  ISSUE_LINK_PATTERN,
};

// What a profile submission has to look like, in one place.
//
// scripts/validate-profile.mjs enforces these against a real pull request, and
// the tests use them to check that the instructions we send a candidate ask for
// something the validator actually accepts. Keeping the rules here is what lets
// those two agree without one being copied into the other.

/** The three fields a profile holds, and nothing else. */
export const FIELDS = ["github_handle", "full_name", "github_trial_issue_link"];

/** The naming convention the profile pull request title follows. */
export const TITLE_PATTERN = /^chore\(profile\): /;

/** A closing keyword in a pull request description, by number or by URL. */
export const LINK_PATTERN =
  /(?:closes|resolves|fixes):?\s*(?:#(\d+)|https:\/\/github\.com\/holdex\/trial\/issues\/(\d+))/i;

/** A GitHub username. */
export const HANDLE_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** The full URL of an application issue, which is what the profile stores. */
export const ISSUE_LINK_PATTERN = /^https:\/\/github\.com\/holdex\/trial\/issues\/(\d+)$/;

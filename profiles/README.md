# Profiles

One file per candidate, named after the GitHub account
that opens the pull request.
Nobody else's file is touched,
so a profile submission never conflicts with another.

## Submitting yours

Your application issue gives you a link that opens this file already filled in.
If you would rather do it by hand, add `profiles/<your-handle>.json`:

```json
{
  "github_handle": "your-handle",
  "full_name": "Your Name",
  "github_trial_issue_link": "https://github.com/holdex/trial/issues/1234"
}
```

Then open a pull request titled `chore(profile): add your-handle profile`,
with `Closes #1234` on a line of its own in the description,
pointing at your own application.

## What happens next

The submission is checked automatically, within minutes,
against [`schema/profile.schema.json`](../schema/profile.schema.json):

1. Your pull request changes this one file and nothing else.
1. The file is valid JSON with exactly the three fields above.
1. The handle in the file is the account opening the pull request.
1. The linked application is yours, and labelled `job-application`.
1. The pull request is titled as described above.

All five pass and it merges by itself,
which reopens your application with your trial goal.
Any of them fails and a comment tells you which one and what to change.
Correct it, push again, and the checks run again.
Working that out from the instructions is the first thing being assessed,
so nobody will fix it for you.

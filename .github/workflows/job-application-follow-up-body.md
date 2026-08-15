<!-- markdownlint-disable MD041 -->

# Your application is live, @${candidate}

<https://github.com/holdex/trial/issues/${issue_number}>

It is public, and it is the thread
where everything about your application happens.

## How this works

There are no screening calls.
You pass two gates, and both of them are pull requests in this repository:

1. **Your profile.**
   It proves you can follow written instructions in GitHub.
1. **Your trial goal.**
   It is specific to the role you applied for, it is reviewed by the team,
   and it arrives in this thread the moment your profile pull request is merged.

Nobody on the team reads your application before
that first pull request is merged.
That is deliberate.
We work across every department in GitHub, async,
and how you handle a repository tells us more than a CV does.

## Step 1: read the guidelines

Our culture and our rules live in one repository,
and you are assessed against them from your first pull request onwards.
Not following them is the most common reason a contribution is rejected.

- <https://github.com/holdex/developers>

## Step 2: open your profile pull request

Read all four points before you start.
If you do not work in git day to day,
the editor link below forks the repository for you when you save,
so this can be done from the browser.

1. Open the profile file in the editor:
   <https://github.com/holdex/trial/edit/main/profile-submission.json>
1. Add your entry at the end of the `team_profiles` list:

   ```json
   {
     "github_handle": "${candidate}",
     "full_name": "Your Name",
     "github_trial_issue_link": "https://github.com/holdex/trial/issues/${issue_number}"
   }
   ```

1. Title the pull request exactly:

   ```text
   chore(profile): add ${candidate} profile
   ```

1. Put this line in the pull request description, on a line of its own:

   ```text
   Closes #${issue_number}
   ```

That last line links your pull request to this application.
Without it, this issue will not reopen with your trial goal.

## What happens next

Once your profile pull request is merged,
this issue reopens with your trial goal
and the conditions it is assessed against.
If you get something wrong along the way, correct it and push again.
Getting it right without being told how is part of what is being measured.

## Stay close

- [Holdex on X](https://x.com/HoldexIo)
- [Holdex CEO](https://bsky.app/profile/zolotokrylin.bsky.social)
- [LinkedIn](https://www.linkedin.com/company/holdex)

## Questions

Ask them in this issue.

<!-- markdownlint-disable MD041 -->

**@${candidate}, your application for ${position} is live:**
<https://github.com/holdex/trial/issues/${issue_number}>

It is public, and it is the thread
where everything about your application happens.

### How this works

There are no screening calls.
You pass two gates, and both of them are pull requests in this repository.
The first proves you can follow written instructions in GitHub.
The second is your trial goal, specific to the role you applied for,
reviewed by the team, and posted in this thread the moment the first one is
merged.

We keep the assessment simple.
We look at whether you follow the Contributing guide,
and whether you hold to the Code of Conduct.

Nobody on the team reads your application before
that first pull request is merged.
That is deliberate.
We work across every department in GitHub, async,
and how you handle a repository tells us more than a CV does.

### Open your profile pull request

Read all five steps before you start.
If you do not work in git day to day,
the editor forks the repository for you when you save,
so this can be done from the browser.

1. Read the [Developer Guidelines](https://github.com/holdex/developers).
   Not following them is the most common reason a contribution is rejected.
1. Open
   [`profile-submission.json`](https://github.com/holdex/trial/edit/main/profile-submission.json)
   and add your entry at the end of the `team_profiles` list:

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

1. Open the pull request.

> [!IMPORTANT]
> That last line is what links your pull request to this application.
> Without it, this issue will not reopen with your trial goal.

### What happens next

Your profile pull request is reviewed within two working days.
Once it is merged, this issue reopens with your trial goal
and the conditions it is assessed against.
If you get something wrong along the way, correct it and push again.
Getting it right without being told how is part of what is measured.

If no pull request appears within three weeks,
we close this application with the reason `no PR was submitted`.
That is not a rejection, and you are welcome to apply again.

Questions go in this issue.
Follow along on [X](https://x.com/HoldexIo),
[Bluesky](https://bsky.app/profile/zolotokrylin.bsky.social)
and [LinkedIn](https://www.linkedin.com/company/holdex).

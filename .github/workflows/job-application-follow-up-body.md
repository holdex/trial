<!-- markdownlint-disable MD041 -->

# 🎉 Thanks for applying, @${candidate}

![Celebration gif](https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzM3aHRxaWg1NWR5ZXV5b3JxcnlrbjZ2c215aGdiejB1YzF5dG93ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xIsloV7zOmt81G/giphy.gif)

Your application is now public:
<https://github.com/holdex/trial/issues/${issue_number}>

Your trial is two pull requests.
The first one is below, and the second one arrives here
once the first is merged.

## Step 1: read the guidelines

Our culture and our rules live in one repository,
and you are assessed against them from your first pull request onwards.

- <https://github.com/holdex/developers>

## Step 2: open your profile pull request

No local setup and no git needed.
GitHub forks the repository for you when you save the file.

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

That last line is what links your pull request to this application.
Without it, this issue will not reopen with your trial goal.

## Step 3: share your application

Ask your network to react with 👍 on this issue.
Reactions decide the order candidates appear on the
[leaderboard](https://github.com/holdex/trial#leaderboard).

Follow us while you are here:

- [Holdex on X](https://x.com/HoldexIo)
- [Holdex CEO](https://bsky.app/profile/zolotokrylin.bsky.social)
- [LinkedIn](https://www.linkedin.com/company/holdex)

## Questions

Ask them right here in this issue 😉

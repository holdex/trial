---
goal: https://github.com/holdex/trial/issues/1211
---

# Repository Access CI

## Overview

Who can reach which repository is currently a thing people remember rather than
a thing that is written down.
This Goal makes the membership file the source of truth, and lets CI apply it.

## Objective

Let anyone change GitHub organisation access by editing one file,
and see the resulting access as a table.

## What you are given

1. GitHub users, by handle.
1. GitHub organisations.
1. Teams belonging to an organisation.
1. Repositories belonging to an organisation.
1. Teams holding specific permissions on specific repositories.
1. Users belonging to teams.

## Declaring who belongs where

A `members_permissions` file defines the complete desired state for users, teams,
repositories, team membership, and repository permissions.
It is the source of truth: removing any of those entries revokes or deletes the
corresponding GitHub access rather than leaving previously granted access in place.
Someone has to maintain it by hand, so its structure is part of what is being judged.

## Applying it automatically

Changing that file reconciles the organisation's permissions through the GitHub
API, driven by GitHub Actions reacting to the change. The workflow applies
removals as well as additions and permission updates until GitHub matches the
declared state.

## Acceptance

1. Adding or changing a user, team, repository, or permission in
   `members_permissions` produces the declared access.
1. Removing a user, team, repository, team membership, or permission from the
   file removes the corresponding GitHub access on the next workflow run.

## Showing the result

A simple table renders who can reach which repository.

## Demo conditions

1. Create two test organisations and as many private repositories as you need.
1. Invite [@zolotokrylin](https://github.com/zolotokrylin) and
   [@markholdex](https://github.com/markholdex) as owners of both.
1. Copy this Goal into one of them and ping the reviewers on that issue.

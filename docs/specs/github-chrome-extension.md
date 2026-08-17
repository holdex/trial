---
goal: https://github.com/holdex/trial/issues/1208
---

# GitHub Chrome Extension

## Overview

GitHub's own interface makes two everyday things harder than they need to be.
This Goal is a working demo of a Chrome extension that fixes both,
scoped to prove you can work with a third-party API and a small UI.
It is a demo, not a production app.

## Objective

Let anyone working in GitHub set a notification preference in one click,
and see every project an issue belongs to without opening each board.

## Setting a custom notification in one click

Setting a custom notification today takes five clicks: Customize, Custom,
Closed, Reopened, Save.

The extension lets the user set that same preference,
notify on `Closed` and `Reopened`, in a single click.

## Seeing every project an issue belongs to

The Projects section of an issue does not show every project it is attached to,
so today the only way to know is to inspect each board by hand.

The extension shows all of them.
The API does expose this: query the `issue` object and read its `projectItems`.

```graphql
query {
  issue(number: ISSUE_NUMBER, repositoryNameWithOwner: "OWNER/REPO") {
    projectItems(first: 100) {
      nodes {
        project {
          id
          name
        }
      }
    }
  }
}
```

Projects in other organisations appear too, when the token allows it.

## Scope

Keep this inside roughly eight hours.
A working demo of both components is the deliverable.

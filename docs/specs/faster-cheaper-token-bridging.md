---
goal: https://github.com/holdex/trial/issues/1213
---

# Token Bridging

## Overview

Moving a token between a chain and its layer two should be reliable and cheap.
This Goal is the smallest honest proof of that: one token, bridged both ways,
with the scripts and tests that show it working.

## Objective

Let a holder move an ERC20 between ETH Sepolia
and the Ozean testnet in either direction, through the OP standard bridge.

Ozean's documentation: <https://docs.ozean.finance/>

## The token on Sepolia

A deployable ERC20 on ETH Sepolia, verified on the block explorer,
with transfer, allowance and balance demonstrably working.

## The bridged token on Ozean

The bridged representation of that token on the Ozean testnet,
deployed through the OP standard bridge and verified on its explorer,
with the right initial supply
and a clear relationship to the token on layer one.

## The repository

A Foundry project holding the contracts, the deployment scripts for both chains,
the bridging scripts for both directions, tests that demonstrate the round trip,
and a README that lets someone else set it up and run it.

## Acceptance

1. Both contracts deploy and verify.
1. The bridging scripts move the token in both directions, repeatably.
1. Errors and permissions are handled deliberately, not incidentally.
1. The README is enough to reproduce all of it.

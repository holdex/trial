---
goal: https://github.com/holdex/trial/issues/1214
---

# Time-Locked Shared Vault

## Overview

A shared vault that pays out early is a bug with a price attached.
This Goal is a Solana program where deposits can only leave once time has passed
and a signer says so.

## Objective

Let several people deposit SOL into one vault,
and withdraw their own deposit only after the vault is both old enough
and resolved.

## Depositing

Any number of users deposit SOL into a shared vault account.

## Withdrawing

A depositor can withdraw what they put in, once both are true:

1. The sixty second time-lock has passed.
1. An authorised signer has marked the vault resolved.

## Deliverables

The Solana program, written against the Rust SDK,
and a README covering setup with `solana-test-validator`,
how to exercise deposit, resolve and withdraw,
and a short explanation of the design.

## Acceptance

1. It compiles and deploys, locally or on devnet.
1. PDA derivation is used.
1. Lamports return to the depositor correctly.
1. Bad input and unauthorised access fail safely.

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
Each deposit creates a record keyed by the vault, depositor, and deposit nonce.
The record stores that deposit's lamport amount, lock-start timestamp, and
withdrawn state, so one depositor's balance is never inferred from the vault's
aggregate balance.

The lock starts separately for each deposit at the timestamp when that deposit
succeeds. Its withdrawal becomes time-eligible sixty seconds later. Deposits
made at different times therefore have different unlock times; a later deposit
never inherits an earlier deposit's elapsed lock time.

## Withdrawing

A depositor can withdraw exactly the amount in one of their deposit records,
once both are true:

1. The sixty second time-lock has passed.
1. An authorised signer has marked the vault resolved.

Withdrawal requires the depositor to sign, transfers only that record's stored
amount, and atomically marks the record withdrawn before completing the
transfer. A withdrawn record can never be used again, even if the vault later
receives more funds.

## Deliverables

The Solana program, written against the Rust SDK,
and a README covering setup with `solana-test-validator`,
how to exercise deposit, resolve and withdraw,
and a short explanation of the design.

## Acceptance

1. It compiles and deploys, locally or on devnet.
1. PDA derivation is used.
1. With deposits of different amounts from multiple depositors, each depositor
   can withdraw exactly their own eligible recorded amounts and no one else's.
1. Deposits made less than sixty seconds ago remain locked even when an older
   deposit is eligible.
1. A second withdrawal from the same deposit record is rejected or made
   impossible, and cannot transfer lamports twice.
1. Bad input and unauthorised access fail safely.

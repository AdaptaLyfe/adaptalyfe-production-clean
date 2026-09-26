---
name: Sleep wake date handling
description: Sleep logging uses a full wake timestamp while exposing a separate local wake-date control.
---

Sleep records already persist `wakeTime` as a complete timestamp, so Wake Date can be derived for editing and recombined with Wake Time before save without adding a schema column. Wake Date must not precede Sleep Date, and wake must be strictly later than fell-asleep time.

**Why:** A time-only comparison rejects valid overnight sleep and allowing equal timestamps creates a zero-length sleep session.

**How to apply:** Keep date/time values local in the form, send the existing full `wakeTime` field through the current API, and enforce strict ordering in both client and server validation.
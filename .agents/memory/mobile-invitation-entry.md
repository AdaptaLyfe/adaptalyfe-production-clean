---
name: Mobile invitation entry
description: Reliability rule for caregiver invitation acceptance in the native app.
---

The native invitation screen must provide its own editable code field and explicit verification action even when a deep link normally carries a code. Deep-link parameters should prefill the field, not be the only input path.

**Why:** Native app launches can lose, alter, or retain stale URL parameters, and a URL-only mobile screen leaves users stuck at an empty loading state.

**How to apply:** Keep the mobile form behavior aligned with Web: normalize invitation codes, validate through the existing invitation endpoint, show validation errors, and keep acceptance disabled until a valid invitation is loaded.
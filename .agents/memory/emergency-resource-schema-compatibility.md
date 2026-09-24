---
name: Emergency resource schema compatibility
description: How to handle deployed emergency-resource tables that lag optional form fields.
---

Older external database schemas can have the core emergency-resource fields but not the newer optional ones. Keep basic create, list, and edit working without selecting or returning absent columns. Never silently discard a filled optional field: require the non-destructive schema update before accepting that value.

**Why:** A historical database backup predates the form's optional fields, while development already has them. A full ORM select or insert against the older shape fails even for a resource that only uses supported fields; silently dropping filled extras would be worse than an actionable error.

**How to apply:** When changing emergency-resource persistence, support both shapes until the external database has been confirmed and migrated. For full form support, apply the targeted additive migration to the verified staging database, not to a guessed endpoint.
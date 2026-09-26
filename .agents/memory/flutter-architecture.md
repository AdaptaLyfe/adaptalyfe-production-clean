---
name: Flutter architecture
description: Layering rules for migrated Flutter features and shared current-user access.
---

Migrated features follow presentation -> BLoC -> repository -> feature/shared API -> ApiClient. Widgets may validate forms and render derived display values, but remote access, persistence, and domain state transitions belong below presentation.

**Why:** Keeping HTTP and session persistence centralized prevents inconsistent bearer handling and makes migrated screens independently testable.

**How to apply:** Reuse the shared current-user API for `/api/user`; keep session tokens in LocalStorage through AuthRepository; add new remote operations to the feature API and repository before exposing them as BLoC events.
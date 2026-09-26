---
name: Flutter navigation
description: Centralized authenticated navigation shell and route protection.
---

Flutter navigation uses GoRouter redirects for auth protection and a Material app-level shell for shared bottom navigation, More modules, drawer navigation, and global logout. Feature screens should not own primary navigation chrome.

**Why:** The existing mobile UX has four primary destinations plus a More surface, and placing the bar only in Home made navigation inconsistent across migrated screens.

**How to apply:** Add new authenticated modules to the route table and the centralized drawer/More destinations. Use `context.go` for top-level destination changes and `context.push` only for nested flows that should participate in the back stack.
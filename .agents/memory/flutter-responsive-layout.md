---
name: Flutter responsive layout
description: Shared responsive sizing conventions for the separate Flutter mobile client.
---

The Flutter client uses a shared AppResponsive helper for compact-phone, regular-phone, and wider-layout breakpoints. Feature screens should derive dialog widths/heights, page padding, and grid columns from available constraints rather than MediaQuery screen size alone when nested inside drawers, sheets, or cards.

**Why:** The same feature is rendered on compact Android/iPhone screens, large phones, split-screen layouts, short landscape viewports, and with keyboard/text scaling. Nested surfaces can be much narrower than the device screen.

**How to apply:** Keep feature behavior and BLoC/API contracts unchanged. Prefer LayoutBuilder, Flexible/Expanded, Wrap, adaptive grids, and inset-aware scroll views. Cap wide grids and keep dialogs within the actual keyboard-adjusted viewport.
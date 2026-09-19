---
name: Academic dialog lifecycle
description: Controller ownership and async completion rules for Academic Planner form dialogs.
---

Form dialogs that submit through a BLoC should be stateful widgets. Their controllers belong to that widget's `initState`/`dispose` lifecycle, and the dialog should remain mounted until the mutation reports success.

**Why:** Local controllers manually disposed after `showDialog` returns can overlap with route teardown and asynchronous BLoC state changes, producing disposed-controller and inherited-widget dependent assertions.

**How to apply:** Keep controller reads inside the dialog state, guard post-`await` UI updates with `mounted`, disable duplicate submission while the action is active, and let a success listener perform the single `Navigator.pop`.
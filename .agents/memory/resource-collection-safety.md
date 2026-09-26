---
name: Resource collection safety
description: The shared web query loader can return null for failed resource reads, and Flutter APIs may receive empty successful payloads.
---

Resource collection consumers must normalize successful or degraded API data to a list before filtering, mapping, or deriving counts. A failed web read can resolve to `null` rather than throwing, and a native read can receive a null collection payload.

**Why:** The Resources page previously treated a recoverable resource API failure as a render exception, which sent the whole app to the global error boundary.

**How to apply:** When adding or changing resource collection reads, preserve the existing empty-state UI for null or empty responses and keep endpoint failures from crashing the route.
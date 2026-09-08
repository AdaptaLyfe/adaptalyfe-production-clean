---
name: Shared chatbot surface
description: The durable mounting rule for preserving one AdaptAI conversation across app routes.
---

The chatbot must be mounted once in the shared authenticated app shell and visibility should be controlled by the allowed routes. Do not mount separate chatbot instances inside individual pages.

**Why:** Page-level mounts unmount during navigation, which resets in-memory messages and can make the daily greeting appear to belong to separate conversations.

**How to apply:** Keep Home and Daily Tasks as route surfaces for the same component instance. Continue using the existing authenticated chat API and server-built task/event context; do not create route-specific chat state or duplicate task data.
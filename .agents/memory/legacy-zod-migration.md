---
name: Legacy Zod migration compatibility
description: Runtime compatibility rule for porting older Drizzle/Zod applications into the pnpm workspace.
---

When porting a legacy application, preserve its working Drizzle ORM, drizzle-zod, and Zod major behavior rather than accepting an automatic Zod v4 rewrite when legacy schemas omit fields that are not always present.

**Why:** Zod v4 schema omission is stricter and can turn previously working module initialization into a runtime crash even when bundling succeeds.

**How to apply:** If a migrated server or browser crashes during `createInsertSchema(...).omit(...)`, compare the original dependency versions and imports first; restore compatible majors instead of editing hundreds of legacy schemas during a behavior-preserving port.
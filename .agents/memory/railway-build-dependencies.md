---
name: Railway build dependencies
description: Railway builder behavior and the requirement to make frontend/backend build tools available during publishing.
---

Railway may build this service with Railpack even when older Nixpacks configuration remains in the repository. Build commands must explicitly install development dependencies before invoking Vite or esbuild, because those tools are intentionally not runtime dependencies.

**Why:** A Railway build reached `npm run build` with production-only dependencies and failed with `vite: not found`, even though the local Nixpacks configuration requested dev dependencies.

**How to apply:** Keep the Railway config on the current builder and use an explicit build command that sets `NPM_CONFIG_PRODUCTION=false`, runs `npm ci --include=dev`, and then runs the production build. Republish after configuration changes.
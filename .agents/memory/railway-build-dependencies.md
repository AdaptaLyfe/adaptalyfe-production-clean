---
name: Railway build dependencies
description: Railway builder behavior and the requirement to make frontend/backend build tools available during publishing.
---

Railway may build this service with Railpack even when older Nixpacks configuration remains in the repository. Build commands must explicitly install development dependencies before invoking Vite or esbuild, because those tools are intentionally not runtime dependencies. The lockfile must also use public npm tarball URLs; Replit can write its internal package-firewall host into `package-lock.json`, which external Railway builders cannot resolve.

**Why:** A Railway build reached `npm run build` with production-only dependencies and failed with `vite: not found`, even though the local Nixpacks configuration requested dev dependencies. The next build then failed before installation completed because a lockfile tarball URL pointed at `package-firewall.replit.local`.

**How to apply:** Keep the Railway config on the current builder and use an explicit build command that sets `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/` and `NPM_CONFIG_PRODUCTION=false`, runs `npm ci --include=dev`, and then runs the production build. Before publishing, scan the lockfile for `package-firewall.replit.local` and replace any such resolved URLs with the matching public npm URL. Republish after configuration changes.
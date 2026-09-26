---
name: Railway build dependencies
description: Railway builder behavior and the requirement to make frontend/backend build tools available during publishing.
---

The Railway service is kept on its last-known-working Nixpacks configuration. Build commands must explicitly install development dependencies before invoking Vite or esbuild, because those tools are intentionally not runtime dependencies. The lockfile must also use public npm tarball URLs; Replit can write its internal package-firewall host (`.replit.local` or `.replit.internal`) into `package-lock.json`, which external Railway builders cannot resolve.

**Why:** A Railway build reached `npm run build` with production-only dependencies and failed with `vite: not found`, even though the local Nixpacks configuration requested dev dependencies. Another build failed before installation completed because a lockfile tarball URL pointed at Replit's private package proxy.

**How to apply:** Keep the Railway config on Nixpacks, let `nixpacks.toml` install development dependencies, and scan the lockfile for `package-firewall.replit.local` and `package-firewall.replit.internal` before publishing. Replace any such resolved URLs with the matching public npm URL, preserving the package version and integrity. Republish after configuration changes.
#!/bin/bash
set -euo pipefail

pnpm install --frozen-lockfile

# Drizzle's push command can open a table-rename resolver even with --force.
# Post-merge runs without a TTY, so schema changes must be applied explicitly
# rather than allowing an unattended database rename or data-loss operation.

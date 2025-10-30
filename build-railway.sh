#!/bin/bash
# Railway Production Build Script
set -e

echo "🏗️  Building frontend..."
npm run build:frontend

echo "📦 Building backend for production..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Railway build complete!"
ls -lh dist/

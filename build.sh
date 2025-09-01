#!/bin/bash
echo "Starting Vite build..."
npx vite build

echo "Starting esbuild for server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
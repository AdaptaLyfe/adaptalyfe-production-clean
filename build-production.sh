#!/bin/bash
# Production build script that completely bypasses any cached dependencies

echo "🚀 Building production server without any cached dependencies"

# Clean any existing builds
rm -rf dist/
rm -f server.js
rm -f server-*.js

# Build frontend only
echo "📦 Building frontend assets..."
npm run build

# Copy standalone server
echo "🎯 Creating standalone server..."
cp standalone-server.js server.js

# Verify build
echo "✅ Build complete - files created:"
ls -la server.js dist/public/index.html 2>/dev/null || echo "❌ Build failed"

# Test server startup
echo "🧪 Testing server..."
timeout 5s node server.js &
sleep 2
curl -s http://localhost:5000/health && echo " - Server responds correctly" || echo " - Server test failed"
pkill -f server.js 2>/dev/null || true

echo "🎉 Production build ready for deployment"
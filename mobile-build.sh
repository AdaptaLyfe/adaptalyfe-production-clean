#!/bin/bash

# Adaptalyfe Mobile Build Script
# This script builds the web app and prepares it for mobile deployment

echo "🚀 Starting Adaptalyfe mobile build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build web application
echo "🔨 Building web application..."
npm run build

# Ensure dist/public directory exists
echo "📁 Ensuring build directory exists..."
mkdir -p dist/public

# Copy static files if needed
echo "📋 Copying static files..."
if [ -d "client/public" ]; then
    cp -r client/public/* dist/public/
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

echo "✅ Mobile build complete!"
echo "📱 iOS project ready at: ios/App/App.xcworkspace"
echo "🎯 Ready for Xcode or CodeMagic build"
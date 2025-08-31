#!/usr/bin/env node

// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Adaptalyfe build for Vercel...');

try {
  // Ensure client directory exists
  if (!fs.existsSync('client')) {
    console.error('❌ Client directory not found');
    process.exit(1);
  }

  // Ensure client/index.html exists
  if (!fs.existsSync('client/index.html')) {
    console.error('❌ client/index.html not found');
    process.exit(1);
  }

  console.log('✅ Project structure validated');

  // Run the build
  console.log('📦 Building frontend with Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully');

  // Verify output
  if (fs.existsSync('dist/public/index.html')) {
    console.log('✅ Frontend build output verified');
  } else {
    console.error('❌ Frontend build output missing');
    process.exit(1);
  }

  if (fs.existsSync('dist/index.js')) {
    console.log('✅ Backend build output verified');
  } else {
    console.error('❌ Backend build output missing');
    process.exit(1);
  }

  console.log('🎉 Vercel build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
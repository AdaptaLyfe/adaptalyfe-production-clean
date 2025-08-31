// Vercel build script - skips frontend build, only builds server
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building server for Vercel deployment...');

try {
  // Install esbuild if not available
  console.log('📦 Ensuring esbuild is available...');
  try {
    execSync('npx esbuild --version', { stdio: 'pipe' });
  } catch {
    console.log('Installing esbuild...');
    execSync('npm install esbuild', { stdio: 'inherit' });
  }

  // Create dist directory if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Only build the server component for Vercel - avoid npm run build entirely
  console.log('📦 Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Verify the build output
  if (fs.existsSync('dist/index.js')) {
    console.log('✅ Server build completed successfully');
    console.log('✅ dist/index.js created');
  } else {
    throw new Error('Build output dist/index.js not found');
  }
  
  console.log('Frontend will be served by Express + Vite in production');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

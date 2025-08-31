// Vercel build script - skips frontend build, only builds server
const { execSync } = require('child_process');

console.log('🚀 Building server for Vercel deployment...');

try {
  // Only build the server component for Vercel
  console.log('📦 Building backend with esbuild...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('✅ Server build completed successfully');
  console.log('Frontend will be served by Express + Vite in production');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}
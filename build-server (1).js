#!/usr/bin/env node

// Build script for server-only (for Render web service)
import { build } from 'esbuild';

async function buildServer() {
  try {
    console.log('Building server for production...');
    
    await build({
      entryPoints: ['server/index.ts'],
      platform: 'node',
      packages: 'external',
      bundle: true,
      format: 'esm',
      outdir: 'dist',
      sourcemap: true,
    });
    
    console.log('✅ Server build completed successfully!');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
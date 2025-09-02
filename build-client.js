#!/usr/bin/env node

// Build script for client-only (for Render static site)
import { build } from 'vite';
import { resolve } from 'path';

async function buildClient() {
  try {
    console.log('Building client for production...');
    
    await build({
      root: resolve(process.cwd(), 'client'),
      build: {
        outDir: resolve(process.cwd(), 'client/dist'),
        emptyOutDir: true,
      }
    });
    
    console.log('✅ Client build completed successfully!');
  } catch (error) {
    console.error('❌ Client build failed:', error);
    process.exit(1);
  }
}

buildClient();
#!/usr/bin/env node
// Static deployment generator - creates a fully static version of Adaptalyfe

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createStaticDeployment() {
  console.log('🚀 Creating static deployment for Adaptalyfe');
  
  try {
    // Create deployment directory
    const deployDir = path.join(__dirname, 'deploy-static');
    await fs.mkdir(deployDir, { recursive: true });
    
    // Copy built assets
    const distDir = path.join(__dirname, 'dist', 'public');
    const assetsExists = await fs.access(distDir).then(() => true).catch(() => false);
    
    if (assetsExists) {
      await fs.cp(distDir, deployDir, { recursive: true });
      console.log('✅ Copied built assets');
    } else {
      console.log('❌ No built assets found - run npm run build first');
      return;
    }
    
    // Create simple Express server for static hosting
    const serverCode = `// Simple static server for Adaptalyfe
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Adaptalyfe Static' });
});

// Catch all routes - serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Adaptalyfe static server running on port \${PORT}\`);
});`;
    
    await fs.writeFile(path.join(deployDir, 'server.js'), serverCode);
    
    // Create package.json for deployment
    const packageJson = {
      "name": "adaptalyfe-static",
      "version": "1.0.0",
      "type": "module",
      "scripts": {
        "start": "node server.js"
      },
      "dependencies": {
        "express": "^4.19.2"
      }
    };
    
    await fs.writeFile(
      path.join(deployDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    console.log('✅ Created static deployment in deploy-static/');
    console.log('📁 Files created:');
    const files = await fs.readdir(deployDir);
    files.forEach(file => console.log(`   - ${file}`));
    
  } catch (error) {
    console.error('❌ Error creating static deployment:', error.message);
  }
}

createStaticDeployment();
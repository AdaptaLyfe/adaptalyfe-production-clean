#!/usr/bin/env node
/**
 * Sync ALL Latest Code to GitHub
 * Syncs all source files to GitHub repository
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let connectionSettings = null;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || 
                     connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const REPO_OWNER = 'Adaptalyfe';
const REPO_NAME = 'adaptalyfe-production-clean';
const BRANCH = 'main';

// Patterns to include
const INCLUDE_PATTERNS = [
  'client/src/**/*.{ts,tsx,css}',
  'server/**/*.ts',
  'shared/**/*.ts',
  '*.{json,md,js,ts}',
  'capacitor.config.ts',
  'vite.config.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'drizzle.config.ts'
];

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.cache/**',
  '**/.vite/**',
  '**/android/**',
  '**/ios/**',
  '**/*.zip',
  '**/sync-*.js',
  '**/.env*'
];

function shouldInclude(filePath) {
  // Check exclusions first
  if (EXCLUDE_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  })) {
    return false;
  }
  return true;
}

async function getAllFiles() {
  const allFiles = [];
  
  for (const pattern of INCLUDE_PATTERNS) {
    const files = await glob(pattern, { 
      cwd: __dirname,
      nodir: true,
      ignore: EXCLUDE_PATTERNS
    });
    allFiles.push(...files);
  }
  
  // Remove duplicates
  return [...new Set(allFiles)].filter(shouldInclude);
}

async function getFileContent(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return Buffer.from(content).toString('base64');
  } catch (error) {
    return null;
  }
}

async function updateFileOnGitHub(octokit, filePath, content, message) {
  try {
    let sha = null;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        ref: BRANCH
      });
      sha = fileData.sha;
    } catch (error) {
      // File doesn't exist
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: message,
      content: content,
      branch: BRANCH,
      ...(sha && { sha })
    });

    return true;
  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    return false;
  }
}

async function syncAllToGitHub() {
  console.log('🚀 Syncing ALL code to GitHub...\n');

  try {
    const octokit = await getGitHubClient();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    console.log('📂 Scanning for files...');
    const files = await getAllFiles();
    console.log(`📦 Found ${files.length} files to sync\n`);

    const timestamp = new Date().toISOString();
    const commitMessage = `🔄 Full sync from Replit - ${timestamp}

Updates include:
- Session persistence implementation
- Logout button in navigation
- Syntax error fixes
- All source code updates`;

    let successCount = 0;
    let failCount = 0;
    const batchSize = 5;

    console.log('⬆️  Uploading files...\n');

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (filePath) => {
        process.stdout.write(`📄 ${filePath}...`);
        const content = await getFileContent(filePath);
        
        if (content) {
          const success = await updateFileOnGitHub(octokit, filePath, content, commitMessage);
          if (success) {
            console.log(' ✅');
            successCount++;
          } else {
            console.log(' ❌');
            failCount++;
          }
        } else {
          console.log(' ⏭️  (not readable)');
          failCount++;
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Full Sync Summary:');
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed/Skipped: ${failCount} files`);
    console.log(`📁 Total: ${files.length} files`);
    console.log('='.repeat(60));
    console.log(`\n🎉 View all changes at:`);
    console.log(`   https://github.com/${REPO_OWNER}/${REPO_NAME}\n`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncAllToGitHub();

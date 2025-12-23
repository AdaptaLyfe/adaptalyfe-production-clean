#!/usr/bin/env node
/**
 * Sync Latest Code to GitHub
 * 
 * This script uses the GitHub API to push your latest code changes
 * to your GitHub repository without using git commands directly.
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GitHub connection settings
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
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
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

// Repository information
const REPO_OWNER = 'Adaptalyfe';
const REPO_NAME = 'adaptalyfe-production-clean';
const BRANCH = 'main'; // Change to 'master' if needed

// Files/folders to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.cache',
  '.vite',
  'sync-to-github.js',
  '.env',
  'android',
  'ios',
  'adaptalyfe-STANDALONE.zip'
];

// Important files to sync
const IMPORTANT_FILES = [
  'client/index.html',
  'client/src/lib/queryClient.ts',
  'client/src/App.tsx',
  'client/src/components/simple-navigation.tsx',
  'client/src/components/AuthCheck.tsx',
  'client/src/hooks/useDashboardLayout.ts',
  'client/src/pages/privacy-policy.tsx',
  'client/src/pages/landing.tsx',
  'client/src/pages/dashboard.tsx',
  'client/public/force-hide-errors.css',
  'client/public/block-error-modal.js',
  'client/public/icon-144.png',
  'client/public/icon-192.png',
  'client/public/icon-512.png',
  'client/public/manifest.json',
  'client/public/sw.js',
  'server/index.ts',
  'server/routes.ts',
  'server/production.ts',
  'package.json',
  'package-lock.json',
  'railway.toml',
  'railway.json',
  'nixpacks.toml',
  'DEPLOY_VERSION.txt',
  'README.md',
  'replit.md',
  'SESSION_PERSISTENCE_CHANGES.md',
  'SYNTAX_ERROR_FIX.md'
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

async function getFileContent(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return Buffer.from(content).toString('base64');
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function updateFileOnGitHub(octokit, filePath, content, message) {
  try {
    // Get current file to check if it exists and get its SHA
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
      // File doesn't exist, will create new
      console.log(`📝 Creating new file: ${filePath}`);
    }

    // Update or create file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: message,
      content: content,
      branch: BRANCH,
      ...(sha && { sha })
    });

    console.log(`✅ Updated: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
    return false;
  }
}

async function syncToGitHub() {
  console.log('🚀 Starting GitHub sync...\n');

  try {
    // Get GitHub client
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getGitHubClient();
    
    // Verify authentication
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    // Get current timestamp for commit message
    const timestamp = new Date().toISOString();
    const commitMessage = `🔧 Complete fix: Auth crash + static files - ${timestamp}\n\nFixes:\n- AuthCheck: Blocks rendering until auth verified\n- useDashboardLayout: Bulletproof null safety\n- Added missing static files (CSS, JS, icons)\n- PWA manifest and service worker`;

    console.log(`📦 Syncing ${IMPORTANT_FILES.length} important files...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const filePath of IMPORTANT_FILES) {
      console.log(`📄 Processing: ${filePath}`);
      
      const content = await getFileContent(filePath);
      if (content) {
        const success = await updateFileOnGitHub(octokit, filePath, content, commitMessage);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`⏭️  Skipping ${filePath} (file not found)`);
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    console.log('='.repeat(50));
    console.log(`\n🎉 View your changes at:`);
    console.log(`   https://github.com/${REPO_OWNER}/${REPO_NAME}`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure GitHub is connected in Replit');
    console.error('2. Check your repository permissions');
    console.error('3. Verify the repository name and owner are correct');
    process.exit(1);
  }
}

// Run the sync
syncToGitHub();

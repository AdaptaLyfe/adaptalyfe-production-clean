#!/usr/bin/env node
/**
 * Force Sync to GitHub (Safe)
 * Fetches latest SHA before updating each file
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

const INCLUDE_PATTERNS = [
  'client/src/**/*.{ts,tsx,css}',
  'server/**/*.ts',
  'shared/**/*.ts',
  '*.{json,md}',
  'capacitor.config.ts',
  'vite.config.ts',
  'tailwind.config.ts'
];

const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.cache/**',
  '**/android/**',
  '**/ios/**',
  '**/*.zip',
  '**/sync-*.js',
  '**/force-*.js'
];

function shouldInclude(filePath) {
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

async function forceUpdateFile(octokit, filePath, content, message) {
  try {
    // ALWAYS fetch the latest SHA right before updating
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
    }

    // Update with the LATEST sha (just fetched)
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: message,
      content: content,
      branch: BRANCH,
      ...(sha && { sha })
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function forceSyncAll() {
  console.log('🚀 Force syncing ALL code to GitHub...\n');

  try {
    const octokit = await getGitHubClient();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    console.log('📂 Scanning files...');
    const files = await getAllFiles();
    console.log(`📦 Found ${files.length} files\n`);

    const timestamp = new Date().toISOString();
    const commitMessage = `🔄 Complete sync - ${timestamp}

All latest code updates including:
- Session persistence & auto-login
- Logout functionality  
- Syntax error fixes
- Full codebase sync`;

    let successCount = 0;
    let failCount = 0;

    console.log('⬆️  Uploading (this may take a few minutes)...\n');

    // Process files one at a time to avoid conflicts
    for (const filePath of files) {
      process.stdout.write(`📄 ${filePath.padEnd(60)}...`);
      
      const content = await getFileContent(filePath);
      
      if (content) {
        const result = await forceUpdateFile(octokit, filePath, content, commitMessage);
        
        if (result.success) {
          console.log(' ✅');
          successCount++;
        } else {
          console.log(` ❌ ${result.error}`);
          failCount++;
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(' ⏭️');
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Force Sync Complete!');
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    console.log(`📁 Total: ${files.length} files`);
    console.log('='.repeat(70));
    console.log(`\n🎉 View your repository:`);
    console.log(`   https://github.com/${REPO_OWNER}/${REPO_NAME}\n`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

forceSyncAll();

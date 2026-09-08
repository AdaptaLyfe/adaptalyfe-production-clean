const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = "Adaptalyfe";
const repo = "adaptalyfe-production-clean";

async function syncFile(filePath) {
  try {
    const fs = require("fs");
    const content = fs.readFileSync(filePath, "utf8");
    const contentEncoded = Buffer.from(content).toString("base64");
    
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      sha = data.sha;
    } catch (error) {
      // File doesn't exist yet
    }
    
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Update ${filePath} - Extended session timeout to 7 days`,
      content: contentEncoded,
      sha,
    });
    
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
  }
}

async function main() {
  console.log("🚀 Syncing session timeout fix to GitHub...\n");
  await syncFile("server/routes.ts");
  console.log("\n✅ Session timeout fix pushed to GitHub!");
  console.log("Railway will auto-deploy in ~2-3 minutes");
}

main();

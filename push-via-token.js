/**
 * Automated GitHub Direct Uploader Script
 * Creates & Uploads codebase to https://github.com/mandalsunilp-crypto/sunil
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const GITHUB_USERNAME = 'mandalsunilp-crypto'
const REPO_NAME = 'sunil'
const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN

if (!TOKEN) {
  console.log('\n❌ Error: Missing GitHub Personal Access Token!')
  console.log('Usage: node push-via-token.js <YOUR_GITHUB_TOKEN>')
  process.exit(1)
}

function request(method, apiPath, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'User-Agent': 'NodeJS-GitHub-Uploader',
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`[HTTP ${res.statusCode}] ${parsed.message || body}`))
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body)
          } else {
            reject(new Error(`[HTTP ${res.statusCode}] ${body}`))
          }
        }
      })
    })

    req.on('error', reject)
    if (data) req.write(JSON.stringify(data))
    req.end()
  })
}

async function main() {
  console.log(`\n🚀 Target Account: ${GITHUB_USERNAME}`)
  console.log(`📦 Target Repository: ${REPO_NAME}\n`)

  console.log('[1/3] Ensuring repository exists on GitHub...')
  let repoExists = false
  try {
    const repoInfo = await request('GET', `/repos/${GITHUB_USERNAME}/${REPO_NAME}`)
    console.log(`  ✅ Repository '${repoInfo.full_name}' found.`)
    repoExists = true
  } catch (err) {
    console.log(`  ⚠️ Repository not found. Creating repository '${REPO_NAME}'...`)
    try {
      await request('POST', '/user/repos', {
        name: REPO_NAME,
        description: 'Verified Hub Platform Production Codebase',
        private: false,
        auto_init: true,
      })
      console.log(`  ✅ Successfully created repository 'https://github.com/${GITHUB_USERNAME}/${REPO_NAME}'`)
      repoExists = true
      await new Promise((r) => setTimeout(r, 2500))
    } catch (createErr) {
      console.error(`  ❌ Failed to create repo: ${createErr.message}`)
    }
  }

  // Ensure default commit ref exists
  try {
    const readmeContent = Buffer.from(`# Verified Hub Platform\nProduction codebase for ${REPO_NAME}`).toString('base64')
    await request('PUT', `/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/README.md`, {
      message: 'Initialize repository README',
      content: readmeContent,
    })
  } catch {
    // Already initialized
  }

  console.log('\n[2/3] Scanning codebase files...')
  const ignoreDirs = ['node_modules', '.next', '.next - Copy', '.git', '.vercel', 'out', 'build', 'scratch', 'verified hub prompt']
  const filesToUpload = []

  function scanDir(dir) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      if (ignoreDirs.includes(item)) continue
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (stat.size < 50 * 1024 * 1024) {
        filesToUpload.push(fullPath)
      }
    }
  }

  scanDir(__dirname)
  console.log(`  Found ${filesToUpload.length} project source files to upload.`)

  console.log('\n[3/3] Uploading codebase files to GitHub...\n')
  let uploadedCount = 0
  let skippedCount = 0

  for (const filePath of filesToUpload) {
    let relPath = path.relative(__dirname, filePath).replace(/\\/g, '/')
    if (relPath.startsWith('./')) relPath = relPath.slice(2)
    if (relPath.startsWith('/')) relPath = relPath.slice(1)

    const encodedPath = relPath
      .split('/')
      .map((segment) =>
        encodeURIComponent(segment)
          .replace(/\(/g, '%28')
          .replace(/\)/g, '%29')
      )
      .join('/')

    const content = fs.readFileSync(filePath).toString('base64')

    try {
      let existingSha = null
      try {
        const fileInfo = await request('GET', `/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${encodedPath}`)
        existingSha = fileInfo.sha
      } catch {
        // File doesn't exist yet on remote
      }

      await request('PUT', `/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${encodedPath}`, {
        message: `Deploy ${relPath}`,
        content,
        sha: existingSha || undefined,
      })

      uploadedCount++
      console.log(`  ✅ [${uploadedCount}/${filesToUpload.length}] Uploaded ${relPath}`)
    } catch (err) {
      skippedCount++
      console.log(`  ❌ [Failed] ${relPath}: ${err.message}`)
    }
  }

  console.log(`\n========================================================`)
  console.log(`  🎉 GITHUB UPLOAD COMPLETE!`)
  console.log(`  Total Uploaded: ${uploadedCount} files`)
  console.log(`  Repository URL: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`)
  console.log(`========================================================\n`)
}

main().catch((err) => {
  console.error('\n❌ Upload error:', err.message)
})

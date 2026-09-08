// setup-govard action: installs @ddtcorex/govard@<version> globally and
// puts it on PATH. Dependency-free (Node stdlib only).
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');

function getJson(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { 'User-Agent': 'setup-govard', Accept: 'application/vnd.github+json' } },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirects <= 0) {
              reject(new Error(`Too many redirects for ${url}`));
              return;
            }
            res.resume();
            resolve(getJson(res.headers.location, redirects - 1));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`GET ${url} -> ${res.statusCode}`));
            return;
          }
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          });
        },
      )
      .on('error', reject);
  });
}

async function resolveVersion(input) {
  const v = (input || 'latest').trim();
  if (v && v.toLowerCase() !== 'latest') {
    return v.replace(/^v/, '');
  }
  const release = await getJson('https://api.github.com/repos/ddtcorex/govard/releases/latest');
  return String(release.tag_name).replace(/^v/, '');
}

async function main() {
  const version = await resolveVersion(process.env.INPUT_VERSION);
  console.log(`setup-govard: installing @ddtcorex/govard@${version}`);
  execSync(`npm i -g @ddtcorex/govard@${version}`, { stdio: 'inherit' });
  const npmBin = execSync('npm bin -g', { encoding: 'utf8' }).trim();
  if (process.env.GITHUB_PATH) {
    fs.appendFileSync(process.env.GITHUB_PATH, npmBin + '\n');
  }
  execSync('govard version', {
    stdio: 'inherit',
    env: { ...process.env, PATH: `${npmBin}:${process.env.PATH}` },
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`setup-govard failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { resolveVersion };

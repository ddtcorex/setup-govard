// setup-govard action: installs @ddtcorex/govard@<version> globally and
// puts it on PATH. Dependency-free (Node stdlib only).
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

function getJson(url, redirects = 5) {
  const headers = { 'User-Agent': 'setup-govard', Accept: 'application/vnd.github+json' };
  const token = (process.env.INPUT_TOKEN || process.env.GITHUB_TOKEN || '').trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers },
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
            reject(new Error(describeFailure(url, res.statusCode)));
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

// describeFailure turns a non-200 response into a message a user can act on.
// The releases lookup is anonymous unless GITHUB_TOKEN is set, and the
// anonymous quota is 60 requests per hour per address, which a shared CI
// runner can exhaust without the caller doing anything wrong.
function describeFailure(url, status) {
  const message = `GET ${url} -> ${status}`;
  if (status === 403 || status === 429) {
    return `${message} (GitHub API quota; pass github-token to authenticate the lookup)`;
  }
  return message;
}

async function resolveVersion(input) {
  const v = (input || 'latest').trim();
  if (v && v.toLowerCase() !== 'latest') {
    return v.replace(/^v/, '');
  }
  const release = await getJson('https://api.github.com/repos/ddtcorex/govard/releases/latest');
  return String(release.tag_name).replace(/^v/, '');
}

// globalBinDir returns where npm puts global executables. npm 9 removed
// `npm bin`, so the prefix is asked for instead: the binaries live in
// `<prefix>/bin` on unix and directly in the prefix on Windows.
function globalBinDir() {
  const prefix = execSync('npm prefix -g', { encoding: 'utf8' }).trim();
  return process.platform === 'win32' ? prefix : path.join(prefix, 'bin');
}

async function main() {
  const version = await resolveVersion(process.env.INPUT_VERSION);
  console.log(`setup-govard: installing @ddtcorex/govard@${version}`);
  execSync(`npm i -g @ddtcorex/govard@${version}`, { stdio: 'inherit' });
  const binDir = globalBinDir();
  if (process.env.GITHUB_PATH) {
    fs.appendFileSync(process.env.GITHUB_PATH, binDir + '\n');
  }
  execSync('govard version', {
    stdio: 'inherit',
    env: { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`setup-govard failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { resolveVersion, describeFailure };

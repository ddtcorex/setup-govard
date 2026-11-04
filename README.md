# setup-govard

GitHub Action that installs the [Govard](https://github.com/ddtcorex/govard)
CLI with version pinning.

## Usage

```yaml
- uses: ddtcorex/setup-govard@v1
  with:
    version: '<version>' # any release tag, or 'latest' (default)

- run: govard version
```

`latest` resolves through the GitHub Releases API, so prereleases are excluded.
A pinned value installs `@ddtcorex/govard@<version>` from the public npm
registry, which is published for every stable release.

The action appends the npm global bin directory to `GITHUB_PATH`, so `govard`
stays on `PATH` for the later steps of the job. It runs on the Node 24 runtime
and needs no Node setup of its own.

## Local check

```bash
docker run --rm -v "$PWD:/action" -w /action node:24-slim \
  sh -c 'INPUT_VERSION=1.82.0 node main.js'
```

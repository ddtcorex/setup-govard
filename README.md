# setup-govard

GitHub Action that installs the [Govard](https://github.com/ddtcorex/govard)
CLI with version pinning.

## Usage

```yaml
- uses: ddtcorex/setup-govard@v1
  with:
    version: '1.70.3' # or 'latest' (default)

- run: govard version
```

`latest` resolves via the GitHub Releases API (stable releases only —
prereleases are excluded by the API). Pinned versions install
`@ddtcorex/govard@<version>` from the public npm registry.

> Note: the `install` CI job (pinned `1.70.3` on 3 OSes) stays red until
> the first stable govard release publishes the npm wrapper; the
> `resolve-only` job is green from day one.

# Changesets

Every user-facing change gets a changeset. Run:

```bash
npx changeset
```

pick the bump (patch / minor / major) and write a one-line description. Commit
the generated markdown file with your change.

On merge to `main`, the release workflow opens a "Version Packages" pull
request that applies the pending changesets and updates the changelog. Merging
*that* PR publishes to npm.

This is deliberately a two-step, human-gated flow rather than publish-on-merge:
under npm's current supply-chain rules a release should be an explicit act.

# Contributing

## Merge protection

The `main` branch must not receive a change until the cross-platform build
has passed. The following GitHub Actions checks are required before merging:

- `Build on Ubuntu`
- `Build on Windows`

The protection rule was applied to `main` and verified through the GitHub API
on 2026-09-10. Its enforced settings are:

- required status checks are strict (the pull request branch must be current);
- both exact checks above are required;
- pull requests are required;
- administrators cannot bypass the rule;
- force pushes and branch deletion are disabled.

Both checks run dependency installation with
`pnpm install --frozen-lockfile`, the complete build, and the frontend output
verification tests. A failure in dependency installation, compilation, build
output verification, or the frontend verification tests makes that check
fail and blocks the merge.

### GitHub repository settings

For the `main` branch, maintain a branch protection rule with these settings:

1. Enable **Require a pull request before merging**.
2. Enable **Require status checks to pass before merging** and add both exact
   checks listed above.
3. Enable **Require branches to be up to date before merging** so the required
   checks apply to the merge commit's current base.
4. Enable **Do not allow bypassing the above settings**. This includes
   repository administrators.
5. Keep force pushes and branch deletion disabled.

When the workflow job names change, update the required checks in the branch
protection rule at the same time. A required check that no longer matches a
workflow job can leave merges blocked indefinitely.
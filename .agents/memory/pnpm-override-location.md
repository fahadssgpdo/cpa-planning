---
name: PNPM override location
description: Where to add transitive dependency overrides without replacing the workspace's platform-pruning rules.
---

Add transitive dependency overrides to the existing `overrides` section in the PNPM workspace configuration, not to a new package-level `pnpm.overrides` block.

**Why:** A package-level override block can supersede the workspace override set during lockfile regeneration, reintroducing many excluded platform binaries and causing large unrelated lockfile churn.

**How to apply:** Extend the existing workspace override map, regenerate the lockfile, and confirm the diff contains only the intended dependency resolution change.
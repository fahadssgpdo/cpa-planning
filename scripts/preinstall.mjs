#!/usr/bin/env node
// Cross-platform preinstall guard — works on Windows and Linux.
// Ensures pnpm is used and removes any stray lock files from other package managers.
import { unlinkSync, existsSync } from "node:fs";

for (const file of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

const agent = process.env["npm_config_user_agent"] ?? "";
if (!agent.startsWith("pnpm/")) {
  console.error("Use pnpm instead of npm or yarn.");
  process.exit(1);
}

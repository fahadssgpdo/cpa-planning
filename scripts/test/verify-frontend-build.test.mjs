import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyFrontendBuild } from "../verify-frontend-build.mjs";

async function withTemporaryOutput(callback) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "frontend-build-"));
  try {
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("accepts a non-empty JavaScript build output", async () => {
  await withTemporaryOutput(async (directory) => {
    await writeFile(path.join(directory, "index.js"), "console.log('ok');");
    await assert.doesNotReject(() => verifyFrontendBuild(directory));
  });
});

test("rejects output without JavaScript files", async () => {
  await withTemporaryOutput(async (directory) => {
    await writeFile(path.join(directory, "index.html"), "<!doctype html>");
    await assert.rejects(
      () => verifyFrontendBuild(directory),
      /no JavaScript files/,
    );
  });
});

test("rejects an HTML document saved with a JavaScript extension", async () => {
  await withTemporaryOutput(async (directory) => {
    await writeFile(
      path.join(directory, "index.js"),
      "<!doctype html><html><body>Not JavaScript</body></html>",
    );
    await assert.rejects(
      () => verifyFrontendBuild(directory),
      /invalid JavaScript files/,
    );
  });
});

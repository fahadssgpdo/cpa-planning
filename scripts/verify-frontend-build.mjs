import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const defaultOutputDirectory = path.join(
  projectRoot,
  "artifacts",
  "cpa-planning",
  "dist",
  "public",
);

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(entryPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

function isHtmlDocument(content) {
  return /^\uFEFF?\s*<(?:!doctype\s+html\b|html(?:\s|>))/i.test(content);
}

export async function verifyFrontendBuild(outputDirectory) {
  const directory = path.isAbsolute(outputDirectory)
    ? outputDirectory
    : path.resolve(process.cwd(), outputDirectory);
  let directoryStats;

  try {
    directoryStats = await stat(directory);
  } catch {
    throw new Error(
      `Frontend build output directory does not exist: ${directory}`,
    );
  }

  if (!directoryStats.isDirectory()) {
    throw new Error(
      `Frontend build output path is not a directory: ${directory}`,
    );
  }

  const javascriptFiles = await collectJavaScriptFiles(directory);
  if (javascriptFiles.length === 0) {
    throw new Error(
      `Frontend build produced no JavaScript files in: ${directory}`,
    );
  }

  const invalidFiles = [];
  for (const javascriptFile of javascriptFiles) {
    const content = await readFile(javascriptFile, "utf8");
    if (content.trim().length === 0 || isHtmlDocument(content)) {
      invalidFiles.push(path.relative(projectRoot, javascriptFile));
    }
  }

  if (invalidFiles.length > 0) {
    throw new Error(
      [
        "Frontend build produced invalid JavaScript files. They are empty or contain an HTML document:",
        ...invalidFiles.map((file) => `- ${file}`),
      ].join("\n"),
    );
  }

  console.log(
    `Verified ${javascriptFiles.length} JavaScript file(s) in ${path.relative(projectRoot, directory) || "."}.`,
  );
}

function getOutputDirectoryFromArgs(args) {
  const directoryFlagIndex = args.indexOf("--dir");
  if (directoryFlagIndex === -1) {
    return defaultOutputDirectory;
  }

  const directory = args[directoryFlagIndex + 1];
  if (!directory || directory.startsWith("--")) {
    throw new Error("The --dir option requires a directory path.");
  }

  return directory;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyFrontendBuild(getOutputDirectoryFromArgs(process.argv.slice(2))).catch(
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
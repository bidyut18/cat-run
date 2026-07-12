#!/usr/bin/env node
/**
 * Package Go binaries into npm platform-specific tarballs.
 *
 * Prerequisites:
 *   make build-all
 *
 * Usage:
 *   node scripts/build-npm.js
 *
 * Publish order:
 *   1. Platform packages first
 *   2. Main package last
 */

const fs = require("fs");
const path = require("path");

const NPM_SCOPE = "@bidyut26";              
const rootPkg = require("../package.json");
const version = rootPkg.version;

const author = "Bidyut Mahanta <bidyutmahanta7768@outlook.com>";
const repoUrl = "https://github.com/bidyut18/cat-run";

const targets = [
  { platform: "darwin", arch: "x64", binDir: "darwin-amd64" },
  { platform: "darwin", arch: "arm64", binDir: "darwin-arm64" },
  { platform: "linux", arch: "x64", binDir: "linux-amd64" },
  { platform: "linux", arch: "arm64", binDir: "linux-arm64" },
  { platform: "win32", arch: "x64", binDir: "windows-amd64" },
];

const npmDir = path.join(__dirname, "..", "npm");
const binDir = path.join(__dirname, "..", "bin");

let missingCount = 0;
const optionalDeps = {};

// ---- 1. Create platform packages ----
for (const target of targets) {
  const pkgName = `${NPM_SCOPE}/cat-run-${target.platform}-${target.arch}`;
  const dirName = `cat-run-${target.platform}-${target.arch}`;
  const pkgDir = path.join(npmDir, dirName);
  fs.mkdirSync(pkgDir, { recursive: true });

  const binaryName = target.platform === "win32" ? "cat-run.exe" : "cat-run";
  const srcBinary = path.join(binDir, target.binDir, binaryName);
  const destBinary = path.join(pkgDir, binaryName);

  if (!fs.existsSync(srcBinary)) {
    console.warn(
      `⚠️  Missing: ${target.binDir}/${binaryName} (run: make build-all)`,
    );
    missingCount++;
    continue;
  }

  fs.copyFileSync(srcBinary, destBinary);
  fs.chmodSync(destBinary, 0o755);

  const pkgJson = {
    name: pkgName,
    version: version,
    description: `cat-run binary for ${target.platform}-${target.arch}`,
    author,
    os: [target.platform],
    cpu: [target.arch],
    files: [binaryName, "README.md"],
    license: "MIT",
    repository: {
      type: "git",
      url: `${repoUrl}.git`,
    },
    homepage: repoUrl,
    publishConfig: {
      access: "public"
    }
  };

  fs.writeFileSync(
    path.join(pkgDir, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n",
  );

  // README.md required to avoid npm spam detection
  const readme = `# ${pkgName}\n\nPlatform-specific binary for [cat-run](${repoUrl}) on ${target.platform} ${target.arch}.\n`;
  fs.writeFileSync(path.join(pkgDir, "README.md"), readme);

  optionalDeps[pkgName] = version;
  console.log(`✅  Created ${pkgName} (v${version})`);
}

if (missingCount > 0) {
  console.warn(`\n⚠️  ${missingCount} binary(s) missing. Run: make build-all`);
  process.exit(1);
}

// ---- 2. Create main wrapper package ----
function createMainWrapper() {
  const mainDir = path.join(npmDir, "cat-run");
  fs.mkdirSync(mainDir, { recursive: true });

  const srcIndex = path.join(__dirname, "..", "index.js");
  if (fs.existsSync(srcIndex)) {
    fs.copyFileSync(srcIndex, path.join(mainDir, "index.js"));
    fs.chmodSync(path.join(mainDir, "index.js"), 0o755);
    console.log("✅  Copied index.js");
  } else {
    console.warn(
      "⚠️  index.js not found at project root; make sure to place it there.",
    );
  }

  const pkgJson = {
    name: "cat-run",
    version: version,
    description:
      "Universal package manager script runner — fast Go binary distributed via npm",
    main: "index.js",
    bin: { "cat-run": "index.js" },
    files: ["index.js", "README.md", "LICENSE"],
    optionalDependencies: optionalDeps,
    keywords: [
      "cli",
      "package-manager",
      "npm",
      "yarn",
      "pnpm",
      "bun",
      "runner",
      "go",
    ],
    author: author,
    license: "MIT",
    repository: {
      type: "git",
      url: `${repoUrl}.git`,
    },
    bugs: { url: `${repoUrl}/issues` },
    homepage: `${repoUrl}#readme`,
    engines: { node: ">=16" },
    publishConfig: {
      access: "public"
    }
  };

  fs.writeFileSync(
    path.join(mainDir, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n",
  );

  console.log(`✅  Created main wrapper (v${version})`);
}

createMainWrapper();

console.log("\n✅  Done! Publish order:");
console.log("    1. npm/cat-run-* (platform packages)");
console.log("    2. npm/cat-run (main wrapper)");
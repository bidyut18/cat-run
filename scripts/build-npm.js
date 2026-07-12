#!/usr/bin/env node
/**
 * build-npm.js — Generate npm packages from Go cross-compiled binaries.
 *
 * Prerequisites: make build-all
 * Usage: node scripts/build-npm.js
 */

const fs = require("fs");
const path = require("path");

// ─── CONFIG ─────────────────────────────────────────────
const NPM_SCOPE     = "@bidyut26";
const GITHUB_USER   = "bidyut18";
const REPO          = `${GITHUB_USER}/cat-run`;
const REPO_URL      = `https://github.com/${REPO}`;
const AUTHOR        = "Bidyut Mahanta <bidyutmahanta7768@outlook.com>";

const rootPkg = require("../package.json");
const VERSION = rootPkg.version;

const TARGETS = [
  { platform: "darwin", arch: "x64",  binDir: "darwin-x64",   bin: "cat-run"      },
  { platform: "darwin", arch: "arm64", binDir: "darwin-arm64",  bin: "cat-run"      },
  { platform: "linux",  arch: "x64",  binDir: "linux-x64",    bin: "cat-run"      },
  { platform: "linux",  arch: "arm64", binDir: "linux-arm64",   bin: "cat-run"      },
  { platform: "win32",  arch: "x64",  binDir: "win32-x64",    bin: "cat-run.exe"  },
];

// ─── PATHS ──────────────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname, "..");
const NPM_DIR  = path.join(ROOT_DIR, "npm");
const BIN_DIR  = path.join(ROOT_DIR, "bin");

// ─── HELPERS ────────────────────────────────────────────
function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function copyExecutable(src, dst) {
  fs.copyFileSync(src, dst);
  fs.chmodSync(dst, 0o755);
}

// ─── BUILD ──────────────────────────────────────────────
rmrf(NPM_DIR);
fs.mkdirSync(NPM_DIR, { recursive: true });

const optionalDeps = {};
let missing = 0;

// 1. Platform-specific binary packages
for (const t of TARGETS) {
  const pkgName = `${NPM_SCOPE}/cat-run-${t.platform}-${t.arch}`;
  const dirName = `cat-run-${t.platform}-${t.arch}`;
  const pkgDir  = path.join(NPM_DIR, dirName);
  fs.mkdirSync(pkgDir, { recursive: true });

  const srcBin = path.join(BIN_DIR, t.binDir, t.bin);
  const dstBin = path.join(pkgDir, t.bin);

  if (!fs.existsSync(srcBin)) {
    console.warn(`⚠️  Missing binary: ${t.binDir}/${t.bin}`);
    missing++;
    continue;
  }

  copyExecutable(srcBin, dstBin);

  writeJson(path.join(pkgDir, "package.json"), {
    name: pkgName,
    version: VERSION,
    description: `cat-run binary for ${t.platform} ${t.arch}`,
    author: AUTHOR,
    license: "MIT",
    os: [t.platform],
    cpu: [t.arch],
    files: [t.bin, "README.md"],
    repository: { type: "git", url: `${REPO_URL}.git` },
    homepage: REPO_URL,
    publishConfig: { access: "public" },
  });

  fs.writeFileSync(
    path.join(pkgDir, "README.md"),
    `# ${pkgName}\n\nPlatform-specific binary for [cat-run](${REPO_URL}) on ${t.platform} ${t.arch}.\n`
  );

  optionalDeps[pkgName] = VERSION;
  console.log(`✅  ${pkgName}`);
}

if (missing > 0) {
  console.error(`\n❌ ${missing} binary(s) missing. Run: make build-all`);
  process.exit(1);
}

// 2. Main wrapper package
const mainDir = path.join(NPM_DIR, "cat-run");
fs.mkdirSync(mainDir, { recursive: true });

// Copy launcher script
const srcIndex = path.join(ROOT_DIR, "index.js");
if (!fs.existsSync(srcIndex)) {
  console.error("❌ index.js not found at project root");
  process.exit(1);
}
fs.copyFileSync(srcIndex, path.join(mainDir, "index.js"));
fs.chmodSync(path.join(mainDir, "index.js"), 0o755);

// Copy README + LICENSE for the wrapper
for (const file of ["README.md", "LICENSE"]) {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(mainDir, file));
}

writeJson(path.join(mainDir, "package.json"), {
  name: "cat-run",
  version: VERSION,
  description: "Universal package manager script runner — fast Go binary distributed via npm",
  main: "index.js",
  bin: { "cat-run": "index.js" },
  files: ["index.js", "README.md", "LICENSE"],
  optionalDependencies: optionalDeps,
  keywords: ["cli", "package-manager", "npm", "yarn", "pnpm", "bun", "runner", "go"],
  author: AUTHOR,
  license: "MIT",
  repository: { type: "git", url: `${REPO_URL}.git` },
  bugs: { url: `${REPO_URL}/issues` },
  homepage: `${REPO_URL}#readme`,
  engines: { node: ">=16" },
  publishConfig: { access: "public" },
});

console.log(`✅  cat-run wrapper (v${VERSION})`);
console.log("\n📦 Publish order: platform packages → cat-run wrapper");
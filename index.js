#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const PLATFORM = os.platform();
const ARCH = os.arch();
const BINARY_NAME = PLATFORM === "win32" ? "star-run.exe" : "star-run";
const NPM_SCOPE = "@bidyut26";

function getBinaryPath() {
  const platformPkg = `${NPM_SCOPE}/star-run-${PLATFORM}-${ARCH}`;
  try {
    const pkgPath = require.resolve(`${platformPkg}/package.json`);
    const binaryPath = path.join(path.dirname(pkgPath), BINARY_NAME);
    if (fs.existsSync(binaryPath)) return binaryPath;
  } catch {
    // Platform-specific optional dependency not installed
  }

  const localBin = path.join(__dirname, "bin", BINARY_NAME);
  if (fs.existsSync(localBin)) return localBin;

  const devBin = path.join(__dirname, BINARY_NAME);
  if (fs.existsSync(devBin)) return devBin;

  return null;
}

const binaryPath = getBinaryPath();

if (!binaryPath) {
  console.error("");
  console.error(`❌  star-run: No binary found for ${PLATFORM}-${ARCH}.`);
  console.error("");
  console.error(`   Supported platforms:`);
  console.error(`   • macOS:   darwin-x64, darwin-arm64`);
  console.error(`   • Linux:   linux-x64, linux-arm64`);
  console.error(`   • Windows: win32-x64`);
  console.error("");
  console.error(`   Install from source:`);
  console.error(`   git clone https://github.com/bidyut18/star-run.git`);
  console.error(`   cd star-run && go build -o bin/star-run ./src`);
  console.error("");
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
  windowsHide: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error(`❌  Failed to spawn star-run: ${err.message}`);
  process.exit(1);
});
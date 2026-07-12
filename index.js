#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const platform = os.platform();
const arch = os.arch();
const binaryName = platform === 'win32' ? 'cat-run.exe' : 'cat-run';

function getBinaryPath() {
  // 1. Try platform-specific optional dependency
  const platformPkg = `@bidyut26/cat-run-${platform}-${arch}`;
  try {
    const pkgPath = require.resolve(`${platformPkg}/package.json`);
    const pkgDir = path.dirname(pkgPath);
    const binaryPath = path.join(pkgDir, binaryName);
    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }
  } catch {
    // Optional dependency not installed for this platform
  }

  // 2. Fallback: local bin/ (for development or manual install)
  const localBin = path.join(__dirname, 'bin', binaryName);
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // 3. Fallback: same directory as index.js (development)
  const devBin = path.join(__dirname, binaryName);
  if (fs.existsSync(devBin)) {
    return devBin;
  }

  return null;
}

const binaryPath = getBinaryPath();

if (!binaryPath) {
  console.error('');
  console.error(`❌  cat-run: No binary found for ${platform}-${arch}.`);
  console.error('');
  console.error('   Supported platforms:');
  console.error('   • macOS:   darwin-x64, darwin-arm64');
  console.error('   • Linux:   linux-x64, linux-arm64');
  console.error('   • Windows: win32-x64');
  console.error('');
  console.error('   Install from source:');
  console.error('   git clone https://github.com/bidyut18/cat-run.git');
  console.error('   cd cat-run && go build -o bin/cat-run ./src');
  console.error('');
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(`❌  Failed to spawn cat-run: ${err.message}`);
  process.exit(1);
});
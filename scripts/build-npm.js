const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootPkg = require("../package.json");

const NPM_SCOPE = "@bidyut26";
const VERSION   = rootPkg.version;

const TARGETS = [
  { platform: "darwin", arch: "x64",  binDir: "darwin-x64",   bin: "star-run"      },
  { platform: "darwin", arch: "arm64", binDir: "darwin-arm64",  bin: "star-run"      },
  { platform: "linux",  arch: "x64",  binDir: "linux-x64",    bin: "star-run"      },
  { platform: "linux",  arch: "arm64", binDir: "linux-arm64",   bin: "star-run"      },
  { platform: "win32",  arch: "x64",  binDir: "win32-x64",    bin: "star-run.exe"  },
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
  if (process.platform !== "win32") {
    fs.chmodSync(dst, 0o755);
  }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

// ─── BUILD ──────────────────────────────────────────────
rmrf(NPM_DIR);
fs.mkdirSync(NPM_DIR, { recursive: true });

const optionalDeps = {};
let missing = 0;

for (const t of TARGETS) {
  const pkgName = `${NPM_SCOPE}/star-run-${t.platform}-${t.arch}`;
  const dirName = `star-run-${t.platform}-${t.arch}`;
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
  const checksum = sha256(dstBin);

  // Derive platform package metadata from rootPkg
  writeJson(path.join(pkgDir, "package.json"), {
    name: pkgName,
    version: VERSION,
    description: `Platform-specific binary for ${rootPkg.name} on ${t.platform} ${t.arch}`,
    author: rootPkg.author,
    license: rootPkg.license,
    os: [t.platform],
    cpu: [t.arch],
    files: [t.bin, "README.md"],
    repository: rootPkg.repository,
    homepage: rootPkg.homepage,
    bugs: rootPkg.bugs,
    publishConfig: { access: "public" },
    starRunChecksum: checksum,
  });

  fs.writeFileSync(
    path.join(pkgDir, "README.md"),
    `# ${pkgName}\n\nPlatform-specific binary for [${rootPkg.name}](${rootPkg.homepage}) on ${t.platform} ${t.arch}.\n`
  );

  optionalDeps[pkgName] = VERSION;
  console.log(`✅  ${pkgName}`);
}

if (missing > 0) {
  console.error(`\n❌ ${missing} binary(s) missing. Run: task build-all`);
  process.exit(1);
}

const mainDir = path.join(NPM_DIR, "star-run");
fs.mkdirSync(mainDir, { recursive: true });

const srcIndex = path.join(ROOT_DIR, "index.js");
if (!fs.existsSync(srcIndex)) {
  console.error("❌ index.js not found at project root");
  process.exit(1);
}
fs.copyFileSync(srcIndex, path.join(mainDir, "index.js"));
if (process.platform !== "win32") {
  fs.chmodSync(path.join(mainDir, "index.js"), 0o755);
}

for (const file of ["README.md", "LICENSE"]) {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(mainDir, file));
}

// Inherit the wrapper package metadata directly from rootPkg
writeJson(path.join(mainDir, "package.json"), {
  name: rootPkg.name,
  version: rootPkg.version,
  description: rootPkg.description,
  main: rootPkg.main,
  bin: rootPkg.bin,
  files: rootPkg.files,
  optionalDependencies: optionalDeps,
  keywords: rootPkg.keywords,
  author: rootPkg.author,
  license: rootPkg.license,
  repository: rootPkg.repository,
  bugs: rootPkg.bugs,
  homepage: rootPkg.homepage,
  engines: rootPkg.engines,
  publishConfig: { access: "public" },
});

console.log(`✅  ${rootPkg.name} wrapper (v${VERSION})`);
console.log("\n📦 Publish order: platform packages → star-run wrapper");
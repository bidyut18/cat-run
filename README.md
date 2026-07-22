# star-run
<div align="center">
<picture >
  <img src="./assets/logo.jpg" alt="star-run logo" width="400" />
</picture>
</div>

> **Universal package manager script runner** – fast, zero‑config, and distributed globally via npm.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)](https://go.dev/)
[![npm version](https://img.shields.io/npm/v/star-run)](https://www.npmjs.com/package/star-run)
![status](https://img.shields.io/badge/status-alpha-orange)
[![CI](https://github.com/bidyut18/star-run/actions/workflows/ci.yaml/badge.svg?branch=release)](https://github.com/bidyut18/star-run/actions/workflows/ci.yaml)
[![Socket Badge](https://badge.socket.dev/npm/package/star-run/0.0.2)](https://badge.socket.dev/npm/package/star-run/0.0.2)

Stop trying to remember whether the current repository uses `npm`, `yarn`, `pnpm`,`Deno`, or `bun`. Just type `star-run dev` and let the runner instantly figure it out for you.

---
## ✨ Features

- ⚡️ **Near‑instant startup** – written in Go, boots in ~3–5 ms with zero runtime overhead.
- 🧠 **Smart detection** – automatically traverses parent directories to identify the correct environment.
- 📡 **Signal forwarding** – gracefully handles `SIGINT`/`SIGTERM` to safely shut down running scripts.
- 📦 **Trivial distribution** – installs as a standalone static binary natively via npm.
- 🚫 **Zero config** – works out of the box. No configuration files needed.
- 🔍 **Conflict warnings** – alerts you when `packageManager` and lockfiles disagree.
- 🛡️ **Pre-flight checks** – fails fast with a clear message if a script doesn't exist.

---

## 📦 Installation

```bash
npm install -g star-run
```

> ⚠️ **Note:** This package is in **alpha**. The API can and will change without warning.

---

## 🚀 Quick Start

```bash
# Run a script (auto-detects npm / yarn / pnpm / bun/Deno)
star-run dev

# Pass arguments through to the underlying script
star-run build --watch

# Install dependencies
star-run --install

# List all available scripts
star-run --list

# Show which package manager was detected
star-run --detect

# Show version
star-run --version

# Show help
star-run --help
```

---

## 📖 Commands

### `star-run <script> [args...]`

Runs any script defined in `package.json`. The correct package manager is detected automatically.

```bash
star-run test
star-run lint --fix
star-run build --mode=production
```

**What happens under the hood:**

| Detected PM | Command executed               |
| ----------- | ------------------------------ |
| npm         | `npm run <script> [args...]`   |
| yarn        | `yarn <script> [args...]`      |
| pnpm        | `pnpm run <script> [args...]`  |
| bun         | `bun run <script> [args...]`   |
| Deno        | `Deno run  <script> [args...]` |

---

### `star-run --install`

Installs dependencies using the detected package manager.

```bash
star-run --install
# 📦 Installing dependencies via pnpm...
```

---

### `star-run --list`

Lists all scripts from `package.json` in a beautifully formatted table.

```bash
star-run --list
```

**Example output:**

```
📦 Detected: npm
────────────────────────────────────────
  build     tsc
  dev       vite
  format    prettier --write .
  lint      eslint .
  start     node dist/index.js
  test      jest
```

If no scripts are defined:

```
No scripts found in package.json.
```

---

### `star-run --detect`

Prints the detected package manager without executing anything.

```bash
star-run --detect
# npm
```

---

### `star-run --version`

Shows the current version of `star-run`.

```bash
star-run --version
# star-run 0.0.2
```

---

### `star-run --help`

Shows the full help message with all available commands.

```bash
star-run --help
```

**Output:**

```
star-run — Universal package manager script runner

Usage:
  star-run <script> [args...]    Run a package.json script
  star-run --install             Install dependencies
  star-run --list                List available scripts
  star-run --detect              Show detected package manager
  star-run --version             Show version
  star-run --help                Show this help message

Examples:
  star-run dev
  star-run build --watch
  star-run test --coverage
```

---

## 🔍 Detection Priority

`star-run` detects the package manager in the following order:

1. **`packageManager` field** in `package.json` (e.g., `"npm@10.0.0"`) — highest priority.
2. **Lockfiles** — checks for `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`,`deno.json`, or `bun.lockb`.
3. **Directory traversal** — walks up parent directories until a match is found.

If the `packageManager` field conflicts with an existing lockfile (e.g., field says `yarn` but `package-lock.json` exists), a warning is printed:

```
⚠️  packageManager says yarn, but found package-lock.json
```

---

## ⚙️ Supported Platforms

| Platform | Architecture | Package                           |
| -------- | ------------ | --------------------------------- |
| macOS    | x64          | `@bidyut26/star-run-darwin-x64`   |
| macOS    | arm64        | `@bidyut26/star-run-darwin-arm64` |
| Linux    | x64          | `@bidyut26/star-run-linux-x64`    |
| Linux    | arm64        | `@bidyut26/star-run-linux-arm64`  |
| Windows  | x64          | `@bidyut26/star-run-win32-x64`    |

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/bidyut18/star-run.git
cd star-run

# Build locally
task build

# Run tests
task test

# Build for all platforms
task build-all

# Package for npm
task package-npm
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🎨 Credits

- **Logo**: Designed using [Qwen](https://qwen.ai), incorporating Mount Fuji aesthetics and developer-focused color semantics to reflect the project's speed and universal compatibility.

// Memastikan dependencies siap sebelum `npm run build`.
// Solusi untuk error Docker "exit code: 127 (/bin/sh: vite: not found)"
// yang terjadi saat platform build menjalankan `npm run build` di
// environment tanpa node_modules (belum install / devDeps ter-omit).
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const vitePkg = path.join(root, "node_modules", "vite", "package.json");

if (existsSync(vitePkg)) {
  console.log("✔ dependencies siap, lanjut ke build");
  process.exit(0);
}

console.log("⚠ node_modules tidak lengkap — menjalankan `npm ci --include=dev` ...");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npm, ["ci", "--include=dev", "--no-audit", "--no-fund"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
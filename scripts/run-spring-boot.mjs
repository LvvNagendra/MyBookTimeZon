import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const backend = path.join(root, "backend");
const isWin = process.platform === "win32";
const cmd = isWin ? "mvnw.cmd" : "./mvnw";
const args = ["-DskipTests", "spring-boot:run"];

/** Minimal KEY=VALUE parser so `backend/.env` feeds the JVM (Spring does not read .env by itself). */
function loadDotEnvFile(filePath) {
  const out = {};
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    return out;
  }
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!key) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const envFromFile = loadDotEnvFile(path.join(backend, ".env"));

const child = spawn(cmd, args, {
  cwd: backend,
  stdio: "inherit",
  shell: isWin,
  env: { ...envFromFile, ...process.env },
});

child.on("exit", (code) => process.exit(code ?? 1));

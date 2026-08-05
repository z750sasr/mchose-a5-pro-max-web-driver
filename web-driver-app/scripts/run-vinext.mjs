import { spawn } from "node:child_process";
import { resolve } from "node:path";

const mode = process.argv[2];
if (!new Set(["dev", "build", "start"]).has(mode)) {
  throw new Error("Expected one of: dev, build, start");
}

const binary = resolve("node_modules", "vinext", "dist", "cli.js");

const child = spawn(process.execPath, [binary, mode], {
  stdio: "inherit",
  env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});

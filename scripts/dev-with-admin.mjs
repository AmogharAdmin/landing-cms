import { spawn } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const contentServer = spawn(process.execPath, [path.join(projectRoot, "scripts", "content-server.mjs")], { stdio: "inherit" });
const nextServer = spawn(process.execPath, [nextBin, "dev"], { stdio: "inherit" });

function shutdown(signal) {
  contentServer.kill(signal);
  nextServer.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

nextServer.on("exit", (code) => {
  contentServer.kill("SIGTERM");
  process.exit(code ?? 0);
});

contentServer.on("exit", (code) => {
  if (code && code !== 0) {
    nextServer.kill("SIGTERM");
    process.exit(code);
  }
});

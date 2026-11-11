import { copyFile, readFile, rename } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sitePath = path.join(projectRoot, "data", "site.json");
const mainPath = path.join(projectRoot, "data", "main-site.json");

async function main() {
  await readFile(mainPath, "utf8");
  const temporaryPath = `${sitePath}.tmp`;
  await copyFile(mainPath, temporaryPath);
  await rename(temporaryPath, sitePath);
  process.stdout.write("Success: data/site.json was restored from data/main-site.json.\n");
}

main().catch((error) => {
  process.stderr.write(`Restore failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

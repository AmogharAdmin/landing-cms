import { copyFile, readFile, rename } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sitePath = path.join(projectRoot, "data", "site.json");
const mainPath = path.join(projectRoot, "data", "main-site.json");

async function main() {
  await readFile(sitePath, "utf8");
  const temporaryPath = `${mainPath}.tmp`;
  await copyFile(sitePath, temporaryPath);
  await rename(temporaryPath, mainPath);
  process.stdout.write("Success: data/main-site.json was updated from data/site.json.\n");
}

main().catch((error) => {
  process.stderr.write(`Save main backup failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

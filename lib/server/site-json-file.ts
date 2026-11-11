import "server-only";

import { copyFile, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SiteData } from "@/types/site";

const contentPath = path.join(process.cwd(), "data", "site.json");
const mainContentPath = path.join(process.cwd(), "data", "main-site.json");

export async function readSiteJsonFile(): Promise<SiteData> {
  const raw = await readFile(contentPath, "utf8");
  return JSON.parse(raw) as SiteData;
}

export async function readMainSiteJsonFile(): Promise<SiteData> {
  const raw = await readFile(mainContentPath, "utf8");
  return JSON.parse(raw) as SiteData;
}

export async function writeSiteJsonFile(data: SiteData): Promise<void> {
  const temporaryPath = `${contentPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temporaryPath, contentPath);
}

/** Overwrite data/site.json with the golden copy from data/main-site.json. */
export async function restoreSiteJsonFromMain(): Promise<void> {
  await readMainSiteJsonFile();
  const temporaryPath = `${contentPath}.tmp`;
  await copyFile(mainContentPath, temporaryPath);
  await rename(temporaryPath, contentPath);
}

/** Update data/main-site.json from the current data/site.json (new golden copy). */
export async function snapshotSiteJsonToMain(): Promise<void> {
  await readSiteJsonFile();
  const temporaryPath = `${mainContentPath}.tmp`;
  await copyFile(contentPath, temporaryPath);
  await rename(temporaryPath, mainContentPath);
}

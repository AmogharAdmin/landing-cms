import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "public", "images");
const targets = [
  { file: "hero-image.webp", maxW: 1920, quality: 72 },
  { file: "hero-imagee.webp", maxW: 1600, quality: 72 },
  { file: "image-1.webp", maxW: 1400, quality: 72 },
  { file: "image-2.webp", maxW: 1400, quality: 72 },
  { file: "image-3.webp", maxW: 1400, quality: 72 },
  { file: "image-4.webp", maxW: 1400, quality: 72 },
  { file: "image-5.webp", maxW: 1200, quality: 72 },
  { file: "logo.webp", maxW: 512, quality: 80 },
  { file: "floor-plan.webp", maxW: 1600, quality: 75 },
  { file: "location-map.webp", maxW: 1400, quality: 75 },
];

for (const t of targets) {
  const input = path.join(dir, t.file);
  if (!fs.existsSync(input)) {
    console.log("skip missing", t.file);
    continue;
  }
  const before = fs.statSync(input).size;
  const out = path.join(dir, `${path.parse(t.file).name}.opt.webp`);
  try {
    await sharp(input)
      .rotate()
      .resize({ width: t.maxW, height: t.maxW, fit: "inside", withoutEnlargement: true })
      .webp({ quality: t.quality, effort: 6 })
      .toFile(out);
    const after = fs.statSync(out).size;
    if (after < before * 0.98) {
      fs.copyFileSync(out, input);
      fs.unlinkSync(out);
      console.log(t.file, `${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
    } else {
      fs.unlinkSync(out);
      console.log(t.file, `kept ${Math.round(before / 1024)}KB`);
    }
  } catch (error) {
    if (fs.existsSync(out)) fs.unlinkSync(out);
    console.log(t.file, "error", error instanceof Error ? error.message : error);
  }
}

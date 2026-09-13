import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcPath = path.join(root, "assets/images/golden.webp");
const outPath = path.join(root, "assets/images/golden-venue.webp");

const meta = await sharp(srcPath).metadata();
const width = meta.width ?? 1670;
const height = meta.height ?? 2800;

const cropHeight = 1500;
const cropTop = 420;

console.log(`Source: ${width}x${height}`);
console.log(`Crop: top=${cropTop}, height=${cropHeight}`);

await sharp(srcPath)
    .extract({ left: 0, top: cropTop, width, height: cropHeight })
    .webp({ quality: 96, effort: 6, smartSubsample: false })
    .toFile(outPath);

const outMeta = await sharp(outPath).metadata();
console.log(`Created ${outPath} (${outMeta.width}x${outMeta.height})`);

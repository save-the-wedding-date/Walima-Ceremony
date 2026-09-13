import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcPath = path.join(root, "assets/images/golden.webp");
const outPath = path.join(root, "assets/images/golden-details.webp");

const TARGET_HEIGHT = 8400;
const BLEND = 140;
const PATCH_TOP = 2280;
const PATCH_HEIGHT = 420;

function blendRows(topData, bottomData, width, blendHeight, channels) {
    const out = Buffer.alloc(width * blendHeight * channels);

    for (let y = 0; y < blendHeight; y++) {
        const mix = y / (blendHeight - 1 || 1);

        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * channels;

            for (let c = 0; c < channels; c++) {
                out[i + c] = Math.round(topData[i + c] * (1 - mix) + bottomData[i + c] * mix);
            }
        }
    }

    return out;
}

const meta = await sharp(srcPath).metadata();
const width = meta.width ?? 1670;
const height = meta.height ?? 2800;
const extensionHeight = TARGET_HEIGHT - height + BLEND;

console.log(`Source: ${width}x${height}`);
console.log(`Target: ${width}x${TARGET_HEIGHT}`);

const stretchedExtension = await sharp(srcPath)
    .extract({ left: 0, top: PATCH_TOP, width, height: PATCH_HEIGHT })
    .resize({ width, height: extensionHeight, kernel: sharp.kernel.lanczos3 })
    .toBuffer();

const sourceTop = await sharp(srcPath)
    .extract({ left: 0, top: 0, width, height: height - BLEND })
    .png()
    .toBuffer();

const sourceOverlap = await sharp(srcPath)
    .extract({ left: 0, top: height - BLEND, width, height: BLEND })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

const extensionOverlap = await sharp(stretchedExtension)
    .extract({ left: 0, top: 0, width, height: BLEND })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

const extensionRemainder = await sharp(stretchedExtension)
    .extract({ left: 0, top: BLEND, width, height: extensionHeight - BLEND })
    .png()
    .toBuffer();

const blendedOverlap = blendRows(
    sourceOverlap.data,
    extensionOverlap.data,
    width,
    BLEND,
    sourceOverlap.info.channels
);

const blendedOverlapPng = await sharp(blendedOverlap, {
    raw: {
        width,
        height: BLEND,
        channels: sourceOverlap.info.channels,
    },
})
    .png()
    .toBuffer();

await sharp({
    create: {
        width,
        height: TARGET_HEIGHT,
        channels: 3,
        background: { r: 196, g: 164, b: 92 },
    },
})
    .composite([
        { input: sourceTop, top: 0, left: 0 },
        { input: blendedOverlapPng, top: height - BLEND, left: 0 },
        { input: extensionRemainder, top: height, left: 0 },
    ])
    .webp({ quality: 96, effort: 6, smartSubsample: false })
    .toFile(outPath);

const outMeta = await sharp(outPath).metadata();
console.log(`Created ${outPath} (${outMeta.width}x${outMeta.height})`);

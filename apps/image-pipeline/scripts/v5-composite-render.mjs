import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v5/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDIT_SIZE = '1024x1024';
const OUTPUT_SIZE = 2000;
const WEBP_QUALITY = 92;

const IDENTITY_LOCK = "IDENTITY LOCK: PRESERVE JAR, WAX, LABEL, PROPORTIONS EXACTLY.";

const PROMPTS = {
  day: `
${IDENTITY_LOCK}
Premium candle on warm beach sand, bright coastal tropical daylight.
Clear sky, bokeh turquoise ocean. Golden sunlight, soft rim light on jar.
Wooden lid ON. Photorealistic coastal lifestyle photography. Ultra high quality.
Exactly ONE candle jar. No background candles.
`.trim(),

  night: `
${IDENTITY_LOCK}
Premium candle on warm beach sand at night.
Lid OFF, placed nearby. Living flame from wick inside jar.
Warm amber glow on sand and jar. Deep navy sky, moonlit ocean background.
Photorealistic cinematic nighttime photography. Dual light: flame + moonlight.
Exactly ONE candle jar. No duplicates.
`.trim(),
};

async function main() {
  console.log('Reading manifest (v5)...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const pendingProducts = manifest.products.filter(p => p.status === 'PENDING' && p.product_asset).slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products ready for composition.');
    return;
  }

  for (const product of pendingProducts) {
    console.log(`[BOT-03/05] Codex Rendering (dall-e-2): ${product.name}`);

    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const productAssetPath = path.join(OUTPUT_DIR, product.product_asset);

    try {
      if (!fs.existsSync(originalPath)) throw new Error(`Original file not found: ${originalPath}`);

      const originalPng = await sharp(originalPath)
        .resize(1024, 1024, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();

      const dayMask = await createMask(productAssetPath, false);
      const nightMask = await createMask(productAssetPath, true);

      // Render Day
      if (!product.day_final) {
        console.log(`  - Rendering DAY final...`);
        const dayResult = await callCodex(originalPng, dayMask, PROMPTS.day);
        const dayFinalPath = path.join(OUTPUT_DIR, `${product.id}-day.webp`);
        await sharp(dayResult).resize(OUTPUT_SIZE, OUTPUT_SIZE).webp({ quality: WEBP_QUALITY }).toFile(dayFinalPath);
        product.day_final = path.relative(OUTPUT_DIR, dayFinalPath);
        console.log(`    -> Saved to ${dayFinalPath}`);
      }

      // Render Night
      if (!product.night_final) {
        console.log(`  - Rendering NIGHT final...`);
        const nightResult = await callCodex(originalPng, nightMask, PROMPTS.night);
        const nightFinalPath = path.join(OUTPUT_DIR, `${product.id}-night.webp`);
        await sharp(nightResult).resize(OUTPUT_SIZE, OUTPUT_SIZE).webp({ quality: WEBP_QUALITY }).toFile(nightFinalPath);
        product.night_final = path.relative(OUTPUT_DIR, nightFinalPath);
        console.log(`    -> Saved to ${nightFinalPath}`);
      }

      console.log(`  - SUCCESS: ${product.name} rendered with Identity Lock.`);

    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function callCodex(imagePng, maskPng, prompt) {
  const response = await openai.images.edit({
    model: 'dall-e-2',
    image: await toFile(imagePng, 'image.png', { type: 'image/png' }),
    mask: await toFile(maskPng, 'mask.png', { type: 'image/png' }),
    prompt: prompt,
    size: EDIT_SIZE,
    n: 1,
    response_format: 'b64_json',
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

async function createMask(productAssetPath, isNight) {
    const { data, info } = await sharp(productAssetPath)
        .resize(1024, 1024, { fit: 'cover', position: 'centre' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const maskData = Buffer.alloc(data.length);
    
    let lidBottom = 0;
    if (isNight) {
        let minY = info.height, maxY = 0;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                if (data[(y * info.width + x) * 4 + 3] > 30) {
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        lidBottom = minY + (maxY - minY) * 0.18;
    }

    for (let i = 0; i < data.length; i += 4) {
        const y = Math.floor(i / 4 / info.width);
        const isProduct = data[i + 3] > 30;
        const preserve = isProduct && (!isNight || y > lidBottom);

        maskData[i] = 255;
        maskData[i + 1] = 255;
        maskData[i + 2] = 255;
        maskData[i + 3] = preserve ? 255 : 0;
    }

    return sharp(maskData, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer();
}

main().catch(console.error);

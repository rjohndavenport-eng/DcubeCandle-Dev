import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v6/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDIT_SIZE = '1024x1024';
const OUTPUT_SIZE = 2000;
const WEBP_QUALITY = 92;

const BRAND_LOCKS = `
Exactly ONE candle product in the image. Do not add another candle or jar.
Do not change any label text or logo. Preserve lettering exactly.
Do not make the label look like a pasted sticker. Blend label edges naturally to jar curvature.
The candle must look like the same physical product, not redesigned.
No background candles or products. No reflections of second products.
`.trim();

const PROMPTS = {
  day: `
Premium luxury candle on warm beach sand in bright coastal tropical daylight.
Clear cerulean sky, soft white clouds on the horizon. Shallow depth-of-field bokeh on turquoise ocean.
Warm golden sunlight, soft halo and rim light on the jar.
Wooden lid ON. Photorealistic coastal lifestyle photography. Ultra high quality.
${BRAND_LOCKS}
`.trim(),

  night: `
Premium luxury candle on warm beach sand at night.
The wooden lid is OFF and rests in the sand nearby.
A living candle flame rises from the wick inside the open jar.
Warm amber and honey-gold candlelight spills across the sand.
Deep navy night sky, moonlit ocean background.
Photorealistic cinematic nighttime photography. Dual light: flame + moonlight. Ultra high quality.
${BRAND_LOCKS}
`.trim(),
};

async function main() {
  console.log('Reading manifest (v6)...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  // Filter for pending products, batch of 2
  const pendingProducts = manifest.products.filter(p => p.status === 'PENDING').slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products to process.');
    return;
  }

  for (const product of pendingProducts) {
    console.log(`[V6-ORCHESTRATOR] Processing Batch Product: ${product.name}`);
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const dayOut = path.join(OUTPUT_DIR, `${product.id}__day.webp`);
    const nightOut = path.join(OUTPUT_DIR, `${product.id}__night.webp`);

    try {
      if (!fs.existsSync(originalPath)) throw new Error(`File not found: ${originalPath}`);

      // 1. Prepare Mask (rembg)
      console.log(`  - Generating product mask...`);
      const fileBuffer = fs.readFileSync(originalPath);
      const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
      const rembgBlob = await removeBackground(fileBlob, { model: 'medium', output: { format: 'image/png' } });
      const fgBuffer = Buffer.from(await rembgBlob.arrayBuffer());

      // 2. Square the Original for Input
      const originalPng = await sharp(originalPath)
        .resize(1024, 1024, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();

      // 3. Render DAY
      console.log(`  - Dispatching BOT-02 (DAY)...`);
      const dayMask = await createMask(fgBuffer, false);
      const dayResult = await callEditor(originalPng, dayMask, PROMPTS.day);
      await sharp(dayResult).resize(OUTPUT_SIZE, OUTPUT_SIZE).webp({ quality: WEBP_QUALITY }).toFile(dayOut);
      product.day_final = path.relative(OUTPUT_DIR, dayOut);

      // 4. Render NIGHT
      console.log(`  - Dispatching BOT-03 (NIGHT)...`);
      const nightMask = await createMask(fgBuffer, true);
      const nightResult = await callEditor(originalPng, nightMask, PROMPTS.night);
      await sharp(nightResult).resize(OUTPUT_SIZE, OUTPUT_SIZE).webp({ quality: WEBP_QUALITY }).toFile(nightOut);
      product.night_final = path.relative(OUTPUT_DIR, nightOut);

      console.log(`  - SUCCESS: ${product.name} rendered.`);
      product.status = 'PROCESSED_V6';

    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
      product.status = 'FAILED_V6';
      product.failure_reason = error.message;
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function callEditor(imagePng, maskPng, prompt) {
  const response = await openai.images.edit({
    model: 'dall-e-2',
    image: await toFile(imagePng, 'image.png', { type: 'image/png' }),
    mask: await toFile(maskPng, 'mask.png', { type: 'image/png' }),
    prompt,
    size: EDIT_SIZE,
    n: 1,
    response_format: 'b64_json',
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

async function createMask(fgBuffer, isNight) {
    const { data, info } = await sharp(fgBuffer)
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
        lidBottom = minY + (maxY - minY) * 0.18; // Lid zone
    }

    for (let i = 0; i < data.length; i += 4) {
        const y = Math.floor(i / 4 / info.width);
        const isProduct = data[i + 3] > 30;
        
        // Opaque (255) = PRESERVE (Original Product)
        // Transparent (0) = EDIT (Environment/Flame)
        
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

import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────
const EDIT_SIZE = '1024x1024';
const OUTPUT_SIZE = 2000;
const WEBP_QUALITY = 92;
const LID_FRACTION = 0.18; // Fraction of height to remove for Night mode (lid)

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v4/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Prompts (V4 Strict) ───────────────────────────────────────────────────────
const GUARDRAILS = `
Exactly ONE candle jar. Do not include duplicate or background candle.
Preserve label text exactly as original. Do not change any letters.
Label must be curved to jar and look physically printed.
If lit: lid must be off and placed nearby.
No sticker edges. No pasted look.
`.trim();

const PROMPTS = {
  day: `
Bright coastal tropical daylight.
Clear cerulean sky, soft white clouds on the horizon. Shallow depth-of-field bokeh on turquoise ocean behind the product.
Warm golden sunlight from upper right, soft halo and rim light on the jar.
Wooden lid rests naturally on top of the candle jar. The jar glass catches clean specular highlights.
Small natural props loosely beside the jar base: one small starfish OR one ridged seashell resting on sand.
Fine sun-bleached sand foreground with gentle ripple texture.
Photorealistic premium coastal lifestyle product photography. Cinematic soft lighting. Ultra high quality.
${GUARDRAILS}
`.trim(),

  night: `
Moonlit ocean scene at night.
The wooden lid has been removed from the jar and rests in the sand nearby at a natural angle, casting a small shadow.
A living candle flame rises from the open wax surface inside the jar at the top, flickering naturally upward.
Warm amber and honey-gold candlelight spills across the sand, glows through the glass jar, and illuminates nearby props.
Deep navy and midnight blue night sky, near-full moon above casting cool silver light on calm ocean in the distance.
Subtle vignette. Realistic contact shadow.
Photorealistic cinematic nighttime product photography. Dual light: warm amber flame + cool silver moonlight. Ultra high quality.
${GUARDRAILS}
`.trim(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// 1. Build mask from rembg (for mask derivation only)
// Uses Blob to handle file paths correctly
async function buildMask(inputPath) {
  const fileBuffer = fs.readFileSync(inputPath);
  const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
  
  const blob = await removeBackground(fileBlob, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  // Measure opaque fraction
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 30) opaque++; }
  
  return { fgBuf: buf, opaqueFrac: opaque / (info.width * info.height) };
}

// 2. Square the ORIGINAL photo (no alpha, fully opaque)
async function squareOriginal(inputPath, size = 1024) {
  return sharp(fs.readFileSync(inputPath))
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

// 3. Square the rembg fg (for mask extraction only)
async function squareFg(fgBuf, size = 1024) {
  return sharp(fgBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

// 4. Build Day Mask (full product = preserve)
async function buildDayMask(fgBuf, size = 1024) {
  const { data, info } = await squareFg(fgBuf, size);

  const maskData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const isProduct = data[i + 3] > 30;
    maskData[i]     = 255;
    maskData[i + 1] = 255;
    maskData[i + 2] = 255;
    maskData[i + 3] = isProduct ? 255 : 0;   // opaque = preserve; transparent = AI fills
  }

  return sharp(maskData, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

// 5. Build Night Mask (Lid removed = transparent/regenerate)
async function buildNightMask(fgBuf, size = 1024) {
  const { data, info } = await squareFg(fgBuf, size);
  const W = info.width, H = info.height;

  // Find vertical bounding box
  let minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 30) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const lidCutRow = minY + Math.round((maxY - minY) * LID_FRACTION);

  const maskData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const y = Math.floor(i / 4 / W);
    const isProduct = data[i + 3] > 30;
    // Preserve only product pixels BELOW the lid cut line
    const preserve = isProduct && y > lidCutRow;

    maskData[i]     = 255;
    maskData[i + 1] = 255;
    maskData[i + 2] = 255;
    maskData[i + 3] = preserve ? 255 : 0;
  }

  return sharp(maskData, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
}

// 6. Call OpenAI Edit
async function callEdit(originalPng, maskPng, prompt) {
  const response = await openai.images.edit({
    model: 'dall-e-2', // or gpt-image-1 if available? "dall-e-2" is standard for edits
    image: await toFile(originalPng, 'product.png', { type: 'image/png' }),
    mask: await toFile(maskPng, 'mask.png', { type: 'image/png' }),
    prompt,
    size: EDIT_SIZE,
    n: 1,
    response_format: 'b64_json',
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

// 7. Finalise -> 2000x2000 WebP
async function finalise(imageBuf) {
  return sharp(imageBuf)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Reading manifest...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  // Filter pending and not yet processed
  const pendingProducts = manifest.products
    .filter(p => p.status === 'PENDING' && (!p.day_scene || !p.night_scene))
    .slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products to process.');
    return;
  }

  console.log(`Processing ${pendingProducts.length} products...`);

  for (const product of pendingProducts) {
    console.log(`Rendering scenes for: ${product.name} (${product.id})`);
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);

    try {
      if (!fs.existsSync(originalPath)) {
        throw new Error(`Original file not found: ${originalPath}`);
      }

      // Prepare inputs
      console.log(`  - Preparing masks...`);
      const { fgBuf } = await buildMask(originalPath);
      const originalPng = await squareOriginal(originalPath);
      
      const dayMaskPng = await buildDayMask(fgBuf);
      const nightMaskPng = await buildNightMask(fgBuf);

      // Render Day
      if (!product.day_scene) {
        console.log(`  - Rendering DAY scene...`);
        const dayResultBuf = await callEdit(originalPng, dayMaskPng, PROMPTS.day);
        const dayOutputBuf = await finalise(dayResultBuf);
        const dayOutputPath = path.join(OUTPUT_DIR, `${product.id}-day.webp`);
        fs.writeFileSync(dayOutputPath, dayOutputBuf);
        console.log(`    -> Saved to ${dayOutputPath}`);
        product.day_scene = path.relative(OUTPUT_DIR, dayOutputPath);
      }

      // Render Night
      if (!product.night_scene) {
        console.log(`  - Rendering NIGHT scene...`);
        const nightResultBuf = await callEdit(originalPng, nightMaskPng, PROMPTS.night);
        const nightOutputBuf = await finalise(nightResultBuf);
        const nightOutputPath = path.join(OUTPUT_DIR, `${product.id}-night.webp`);
        fs.writeFileSync(nightOutputPath, nightOutputBuf);
        console.log(`    -> Saved to ${nightOutputPath}`);
        product.night_scene = path.relative(OUTPUT_DIR, nightOutputPath);
      }

      // Mark processed? No, keep as PENDING until validation passes?
      // Or mark as PROCESSED_PENDING_VALIDATION?
      // Let's keep status PENDING but fields are filled.
      
    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
      if (error.response) {
          console.error(`    OpenAI Error: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log('Manifest updated.');
}

main().catch(console.error);

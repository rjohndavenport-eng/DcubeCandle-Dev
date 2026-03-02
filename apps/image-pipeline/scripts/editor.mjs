/**
 * CODEX-EDITOR v2 — OpenAI gpt-image-1 backend
 *
 * Pipeline per image:
 *   1. rembg extracts product onto transparent background (RGBA PNG)
 *   2. Pad/centre to 1024×1024 square PNG (required by images.edit)
 *   3. openai.images.edit(model=gpt-image-1, image=product-transparent, prompt)
 *      → OpenAI fills the transparent zone with the styled scene
 *   4. Upscale result to 2048×2048, export WebP q=92
 *   5. Update manifest.json
 *
 * Fallback (glass/translucent products where rembg < 15% opaque):
 *   Skip rembg → use openai.images.generate with original photo as reference
 */

import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const EDIT_SIZE     = '1024x1024';   // images.edit input/output size
const OUTPUT_SIZE   = 2048;          // final export px (square)
const WEBP_QUALITY  = 92;
const MIN_OPAQUE    = 0.15;          // below this → skip rembg, use generate fallback

const MANIFEST_PATH = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Style prompts ──────────────────────────────────────────────────────────────
//
// These are tuned to the reference images:
//   - Sarasota Sunshine candle beach hero
//   - Diffuser beach lifestyle set
//   - Diffuser studio gift box
//
const PROMPTS = {
  coastal_lifestyle: `
Premium luxury product sitting on warm sandy beach.
Turquoise ocean and bright blue sky with soft clouds in background.
Shallow depth-of-field bokeh on the ocean.
Warm golden sunlight bloom from the upper right corner.
Small natural props at the base of the product: one halved citrus orange slice, one small starfish, one seashell — all resting on sand. Props do not cover any text or label.
Fine beach sand in the foreground showing natural texture.
Photorealistic premium lifestyle product photography.
Ultra high quality. Soft cinematic lighting.
The product pixels are masked and must not be changed in any way. Only generate the background scene. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface. Every letter and marking must remain pixel-perfect as provided.
`.trim(),

  clean_studio: `
Premium luxury product on a pure white to soft cream gradient studio surface.
Clean bright studio lighting from upper left. Soft elegant shadow beneath the product.
No props. Minimal composition. Sophisticated luxury brand aesthetic.
Photorealistic premium studio product photography. Ultra high quality.
The product pixels are masked and must not be changed in any way. Only generate the background scene. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface. Every letter and marking must remain pixel-perfect as provided.
`.trim(),
};

// ── Step 1: rembg extraction ──────────────────────────────────────────────────
async function extractForeground(inputPath) {
  const fileUrl  = pathToFileURL(inputPath).href;
  const blob     = await removeBackground(fileUrl, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf      = Buffer.from(await blob.arrayBuffer());

  // Measure opaque fraction
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 30) opaque++; }
  const opaqueFrac = opaque / (info.width * info.height);

  return { buf, opaqueFrac };
}

// ── Step 2: Pad to square PNG ─────────────────────────────────────────────────
//
// images.edit requires a square PNG.
// We centre the extracted product in a 1024×1024 transparent canvas.
//
async function padToSquare(fgBuf, size = 1024) {
  const meta = await sharp(fgBuf).metadata();

  // Scale so the product fills ~80% of the target square
  const targetFill = Math.round(size * 0.80);
  const scale      = Math.min(targetFill / meta.width, targetFill / meta.height);
  const scaledW    = Math.round(meta.width  * scale);
  const scaledH    = Math.round(meta.height * scale);

  const resized = await sharp(fgBuf)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .toBuffer();

  const left = Math.round((size - scaledW) / 2);
  const top  = Math.round((size - scaledH) / 2);

  return sharp({
    create: { width: size, height: size, channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

// ── Step 3a: images.edit — product on transparent → fill background ───────────
//
// We pass an EXPLICIT mask (separate PNG) in addition to the image so OpenAI has
// no ambiguity about what to touch:
//   mask transparent (alpha=0)  → OpenAI generates here  (the background)
//   mask opaque    (alpha=255)  → OpenAI preserves here  (the product + label)
//
// We also harden the product alpha before sending (any alpha > 30 → 255) so
// semi-transparent edges are fully opaque and the label is never partially "in"
// the edit zone.
//
async function callEdit(squarePngBuf, prompt) {
  // Harden alpha + build explicit mask in one pass
  const { data, info } = await sharp(squarePngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hardened = Buffer.alloc(data.length);
  const maskData = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const isProduct = data[i + 3] > 30;

    // Hardened image: fully opaque product, fully transparent background
    hardened[i]     = data[i];
    hardened[i + 1] = data[i + 1];
    hardened[i + 2] = data[i + 2];
    hardened[i + 3] = isProduct ? 255 : 0;

    // Mask: opaque (255) = preserve product, transparent (0) = edit background
    maskData[i]     = 255;
    maskData[i + 1] = 255;
    maskData[i + 2] = 255;
    maskData[i + 3] = isProduct ? 255 : 0;
  }

  const hardenedPng = await sharp(hardened, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();

  const maskPng = await sharp(maskData, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();

  const imageFile = await toFile(hardenedPng, 'product.png', { type: 'image/png' });
  const maskFile  = await toFile(maskPng,     'mask.png',    { type: 'image/png' });

  const response = await openai.images.edit({
    model:   'gpt-image-1',
    image:   imageFile,
    mask:    maskFile,
    prompt,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });

  const b64 = response.data[0].b64_json;
  return Buffer.from(b64, 'base64');
}

// ── Step 3b: images.generate fallback — for transparent/glass products ────────
//
// When rembg can't extract the product (glass, translucent), we send the
// original photo to images.generate and ask OpenAI to replace the background
// while keeping the product intact.
//
async function callGenerate(originalPath, prompt) {
  const originalBuf = readFileSync(originalPath);

  // Convert to square PNG for the API
  const squareBuf = await sharp(originalBuf)
    .resize(1024, 1024, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const imageFile = await toFile(squareBuf, 'product.png', { type: 'image/png' });

  const response = await openai.images.edit({
    model:   'gpt-image-1',
    image:   imageFile,
    prompt:  `${prompt}\n\nThe background of this product photo should be replaced with the described scene. The product itself — including all text, labels, logo, and product shape — must remain completely unchanged.`,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });

  const b64 = response.data[0].b64_json;
  return Buffer.from(b64, 'base64');
}

// ── Step 4: upscale → 2048×2048 WebP ─────────────────────────────────────────
async function finalise(imageBuf) {
  return sharp(imageBuf)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ── Core per-image edit ───────────────────────────────────────────────────────
async function editImage(entry) {
  const { id, input_path, output_path, category, variant } = entry;
  const prompt = PROMPTS[variant] ?? PROMPTS.coastal_lifestyle;

  console.log(`[CODEX-EDITOR] [${id}] [${input_path.split('/').pop()}] [${variant}] → processing`);

  try {
    // 1. Extract foreground with rembg
    console.log(`[CODEX-EDITOR] [${id}] extracting foreground…`);
    const { buf: fgBuf, opaqueFrac } = await extractForeground(input_path);
    console.log(`[CODEX-EDITOR] [${id}] opaque fraction: ${(opaqueFrac * 100).toFixed(1)}%`);

    let resultBuf;
    let strategy;

    if (opaqueFrac >= MIN_OPAQUE) {
      // ── Standard path: transparent product → images.edit fills background ──
      console.log(`[CODEX-EDITOR] [${id}] padding to square → calling gpt-image-1 edit…`);
      const squarePng = await padToSquare(fgBuf);
      strategy   = `rembg(medium) + gpt-image-1 edit, opaque=${(opaqueFrac*100).toFixed(0)}%`;
      resultBuf  = await callEdit(squarePng, prompt);
    } else {
      // ── Fallback: glass/translucent product → generate with original ────────
      console.log(`[CODEX-EDITOR] [${id}] low opaque fraction — using gpt-image-1 generate fallback…`);
      strategy   = `gpt-image-1 generate (original photo, opaque=${(opaqueFrac*100).toFixed(0)}% too low for rembg)`;
      resultBuf  = await callGenerate(input_path, prompt);
    }

    // 4. Upscale + WebP
    const output = await finalise(resultBuf);

    // Write
    const outDir = dirname(output_path);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(output_path, output);

    const sizeKB = Math.round(output.length / 1024);
    console.log(`[CODEX-EDITOR] [${id}] [${output_path.split('/').pop()}] SUCCESS [${sizeKB} KB]`);

    return {
      ...entry,
      status:        'SUCCESS',
      prompt_used:   prompt.slice(0, 120) + '…',
      params_used:   strategy,
      failure_reason: '',
    };

  } catch (err) {
    console.error(`[CODEX-EDITOR] [${id}] FAILED: ${err.message}`);
    return {
      ...entry,
      status:        'FAILED',
      prompt_used:   '',
      params_used:   '',
      failure_reason: err.message,
    };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[CODEX-EDITOR] OPENAI_API_KEY not set — check .env file');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const pending  = manifest.filter(e => e.status === 'PENDING');

  console.log(`[CODEX-EDITOR] ${pending.length} PENDING entries to process (model: gpt-image-1)`);

  const BATCH_SIZE = 3;   // OpenAI rate limit — 3 parallel is safe
  const updated    = [...manifest];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch    = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total    = Math.ceil(pending.length / BATCH_SIZE);

    console.log(`\n[CODEX-EDITOR] ── BATCH ${batchNum}/${total} ──────────────────────────────`);

    // Run batch sequentially to respect rate limits and avoid OOM
    for (const entry of batch) {
      const result = await editImage(entry);
      const idx    = updated.findIndex(e => e.id === entry.id);
      updated[idx] = result;
      writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2));
    }

    const batchResults = batch.map(e => updated.find(u => u.id === e.id));
    const ok  = batchResults.filter(e => e.status === 'SUCCESS').length;
    const bad = batchResults.filter(e => e.status === 'FAILED').length;
    console.log(`[CODEX-EDITOR] BATCH ${batchNum} complete — ${ok} SUCCESS, ${bad} FAILED`);
  }

  const success = updated.filter(e => e.status === 'SUCCESS').length;
  const failed  = updated.filter(e => e.status === 'FAILED').length;

  console.log(`\n[CODEX-EDITOR] ═══ COMPLETE ════════════════════════════`);
  console.log(`[CODEX-EDITOR] ${updated.length} total | ${success} SUCCESS | ${failed} FAILED`);

  if (failed > 0) {
    console.log('\n[CODEX-EDITOR] FAILURES:');
    updated.filter(e => e.status === 'FAILED').forEach(e => {
      console.log(`  [${e.id}] ${e.input_path.split('/').pop()} — ${e.failure_reason}`);
    });
  }
}

main().catch(err => {
  console.error('[CODEX-EDITOR] FATAL:', err);
  process.exit(1);
});

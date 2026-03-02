/**
 * CODEX-EDITOR-NIGHT v2
 * Nighttime lit candle versions of the 16 product images.
 *
 * v2 fixes:
 *   - Lid strip: for candle products, the top 18% of the product bounding box is
 *     excluded from the preserve mask → AI generates a lit flame there instead of
 *     preserving the wooden cap.
 *   - Post-composite label lock: after AI generates background + flame, the clean
 *     rembg body (no lid zone) is composited back on top → pixel-perfect label/logo.
 *
 * - Candles: dark beach night, visible flame from open jar, warm amber glow
 * - Diffuser/room_spray: same night ambience, no flame
 * - Output: products/_styled-night/
 */

import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, basename } from 'path';

const EDIT_SIZE    = '1024x1024';
const OUTPUT_SIZE  = 2048;
const WEBP_QUALITY = 92;
const MIN_OPAQUE   = 0.15;
// Top fraction of product bounding box treated as "lid zone" for candles
const LID_FRACTION = 0.18;

const MANIFEST_SRC  = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const OUTPUT_DIR    = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled-night';
const MANIFEST_OUT  = `${OUTPUT_DIR}/manifest-night.json`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Night prompts ─────────────────────────────────────────────────────────────

const NIGHT_PROMPTS = {
  candle: `
Premium luxury candle sitting on warm beach sand at nighttime.
The wooden lid has been removed. The glass jar is open at the top.
A beautiful warm lit candle flame rises naturally from the open wax surface at the top of the jar, casting a warm amber and golden glow.
The flame illuminates the surrounding sand and props with a soft warm radiance.
Dark deep blue and purple night sky above, soft moonlight on the calm ocean in the background.
Gentle ocean waves catching the moonlight.
Warm candlelight glows through the glass jar and reflects on nearby props: a starfish and seashell resting in the sand.
Romantic, intimate, premium lifestyle atmosphere.
Photorealistic cinematic nighttime product photography. Ultra high quality.
The label pixels on the jar body are masked and must not be changed in any way. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface on the jar body. Every letter and marking must remain pixel-perfect as provided.
`.trim(),

  diffuser: `
Premium luxury reed diffuser sitting on warm beach sand at dusk.
Dark deep blue and purple evening sky, soft moonlight on the calm ocean.
Gentle warm ambient light from the scene illuminates the diffuser bottle.
The reed sticks are silhouetted elegantly against the sky.
Romantic evening premium lifestyle atmosphere.
Photorealistic cinematic dusk product photography. Ultra high quality.
The product pixels are masked and must not be changed in any way. Only generate the background scene. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface. Every letter and marking must remain pixel-perfect as provided.
`.trim(),

  room_spray: `
Premium luxury room spray bottle on a clean dark studio surface.
Soft warm moody studio lighting, deep charcoal or navy background with subtle gradient.
Elegant long shadow beneath the bottle. Sophisticated nighttime luxury brand aesthetic.
Photorealistic cinematic studio product photography. Ultra high quality.
The product pixels are masked and must not be changed in any way. Only generate the background scene. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface. Every letter and marking must remain pixel-perfect as provided.
`.trim(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function extractForeground(inputPath) {
  const fileUrl = pathToFileURL(inputPath).href;
  const blob    = await removeBackground(fileUrl, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 30) opaque++; }
  return { buf, opaqueFrac: opaque / (info.width * info.height) };
}

async function padToSquare(fgBuf, size = 1024) {
  const meta       = await sharp(fgBuf).metadata();
  const targetFill = Math.round(size * 0.80);
  const scale      = Math.min(targetFill / meta.width, targetFill / meta.height);
  const scaledW    = Math.round(meta.width  * scale);
  const scaledH    = Math.round(meta.height * scale);
  const resized    = await sharp(fgBuf).resize(scaledW, scaledH, { fit: 'fill' }).toBuffer();
  const left       = Math.round((size - scaledW) / 2);
  const top        = Math.round((size - scaledH) / 2);
  return sharp({ create: { width: size, height: size, channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

// ── callEditCandle ─────────────────────────────────────────────────────────────
//
// For candle products:
//   1. Find product vertical bounding box.
//   2. Mark top LID_FRACTION of product height as editable (lid zone) so the AI
//      generates a flame there instead of preserving the wooden cap.
//   3. Call images.edit with lid-stripped mask.
//   4. Post-composite: paste clean rembg body (no lid) back over the AI result
//      to guarantee pixel-perfect label/logo fidelity.
//
async function callEditCandle(squarePngBuf, prompt) {
  const { data, info } = await sharp(squarePngBuf).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  // ── Find vertical bounding box of opaque product pixels ────────────────────
  let minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 30) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bboxH      = maxY - minY;
  const lidCutRow  = minY + Math.round(bboxH * LID_FRACTION);

  // ── Build hardened image + mask with lid zone excluded ─────────────────────
  const hardened = Buffer.alloc(data.length);
  const maskData = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const y          = Math.floor(i / 4 / W);
    const isProduct  = data[i + 3] > 30;
    const isLid      = isProduct && y <= lidCutRow;
    const preserve   = isProduct && !isLid;    // body + label only

    hardened[i]     = data[i];
    hardened[i + 1] = data[i + 1];
    hardened[i + 2] = data[i + 2];
    hardened[i + 3] = preserve ? 255 : 0;

    maskData[i]     = 255;
    maskData[i + 1] = 255;
    maskData[i + 2] = 255;
    maskData[i + 3] = preserve ? 255 : 0;  // transparent = AI fills; opaque = preserve
  }

  const hardenedPng = await sharp(hardened,
    { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const maskPng = await sharp(maskData,
    { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(hardenedPng, 'product.png', { type: 'image/png' }),
    mask:  await toFile(maskPng,     'mask.png',    { type: 'image/png' }),
    prompt,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });

  const aiBuf = Buffer.from(response.data[0].b64_json, 'base64');

  // ── Post-composite: lock label/logo pixels from original source ────────────
  // hardenedPng has the clean body (no lid) with full transparency elsewhere.
  // Compositing it over the AI result overwrites any label drift with exact pixels.
  return sharp(aiBuf)
    .composite([{ input: hardenedPng, blend: 'over' }])
    .png()
    .toBuffer();
}

// ── callEdit — for non-candle products (diffuser, room_spray) ─────────────────
//
// Standard mask strategy: preserve full product, edit background only.
//
async function callEdit(squarePngBuf, prompt) {
  const { data, info } = await sharp(squarePngBuf).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });

  const hardened = Buffer.alloc(data.length);
  const maskData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const isProduct  = data[i + 3] > 30;
    hardened[i]      = data[i];
    hardened[i + 1]  = data[i + 1];
    hardened[i + 2]  = data[i + 2];
    hardened[i + 3]  = isProduct ? 255 : 0;
    maskData[i]      = 255;
    maskData[i + 1]  = 255;
    maskData[i + 2]  = 255;
    maskData[i + 3]  = isProduct ? 255 : 0;
  }

  const hardenedPng = await sharp(hardened,
    { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const maskPng = await sharp(maskData,
    { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(hardenedPng, 'product.png', { type: 'image/png' }),
    mask:  await toFile(maskPng,     'mask.png',    { type: 'image/png' }),
    prompt,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });

  const aiBuf = Buffer.from(response.data[0].b64_json, 'base64');

  // Post-composite for diffuser/room_spray too — locks label pixels
  return sharp(aiBuf)
    .composite([{ input: hardenedPng, blend: 'over' }])
    .png()
    .toBuffer();
}

async function callGenerate(inputPath, prompt) {
  const squareBuf = await sharp(readFileSync(inputPath))
    .resize(1024, 1024, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(squareBuf, 'product.png', { type: 'image/png' }),
    prompt: `${prompt}\n\nReplace only the background with the described night scene. The product, all text, labels, and logos must remain completely unchanged.`,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

async function finalise(imageBuf) {
  return sharp(imageBuf)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ── Per-image ─────────────────────────────────────────────────────────────────

async function editImage(entry) {
  const { id, input_path, category } = entry;
  const outputPath = `${OUTPUT_DIR}/${basename(entry.output_path)}`;
  const prompt     = NIGHT_PROMPTS[category] ?? NIGHT_PROMPTS.candle;

  console.log(`[CODEX-EDITOR-NIGHT] [${id}] [${input_path.split('/').pop()}] [${category}] → processing`);

  try {
    const { buf: fgBuf, opaqueFrac } = await extractForeground(input_path);
    console.log(`[CODEX-EDITOR-NIGHT] [${id}] opaque: ${(opaqueFrac * 100).toFixed(1)}%`);

    let resultBuf, strategy;
    if (opaqueFrac >= MIN_OPAQUE) {
      const squarePng = await padToSquare(fgBuf);
      if (category === 'candle') {
        console.log(`[CODEX-EDITOR-NIGHT] [${id}] → candle edit (lid strip + flame zone + label lock)`);
        strategy  = `rembg(medium) + gpt-image-1 candle-night (lid stripped, label locked), opaque=${(opaqueFrac*100).toFixed(0)}%`;
        resultBuf = await callEditCandle(squarePng, prompt);
      } else {
        console.log(`[CODEX-EDITOR-NIGHT] [${id}] → standard edit (label lock)`);
        strategy  = `rembg(medium) + gpt-image-1 night edit (label locked), opaque=${(opaqueFrac*100).toFixed(0)}%`;
        resultBuf = await callEdit(squarePng, prompt);
      }
    } else {
      console.log(`[CODEX-EDITOR-NIGHT] [${id}] → gpt-image-1 generate fallback`);
      strategy  = `gpt-image-1 generate (glass product, opaque=${(opaqueFrac*100).toFixed(0)}%)`;
      resultBuf = await callGenerate(input_path, prompt);
    }

    const output = await finalise(resultBuf);
    const outDir = dirname(outputPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(outputPath, output);

    const sizeKB = Math.round(output.length / 1024);
    console.log(`[CODEX-EDITOR-NIGHT] [${id}] [${basename(outputPath)}] SUCCESS [${sizeKB} KB]`);

    return { ...entry, output_path: outputPath, status: 'SUCCESS',
      prompt_used: prompt.slice(0, 120) + '…', params_used: strategy, failure_reason: '' };

  } catch (err) {
    console.error(`[CODEX-EDITOR-NIGHT] [${id}] FAILED: ${err.message}`);
    return { ...entry, output_path: outputPath, status: 'FAILED',
      failure_reason: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[CODEX-EDITOR-NIGHT] OPENAI_API_KEY not set'); process.exit(1);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const dayManifest = JSON.parse(readFileSync(MANIFEST_SRC, 'utf8'));

  let manifest;
  if (existsSync(MANIFEST_OUT)) {
    manifest = JSON.parse(readFileSync(MANIFEST_OUT, 'utf8'));
  } else {
    manifest = dayManifest.map(e => ({
      ...e,
      output_path:    `${OUTPUT_DIR}/${basename(e.output_path)}`,
      status:         'PENDING',
      prompt_used:    '',
      params_used:    '',
      failure_reason: '',
      notes:          'nighttime version',
    }));
    writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
  }

  const pending = manifest.filter(e => e.status === 'PENDING');
  console.log(`[CODEX-EDITOR-NIGHT] ${pending.length} PENDING entries (model: gpt-image-1 night v2)`);

  const BATCH_SIZE = 3;
  const updated    = [...manifest];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch    = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total    = Math.ceil(pending.length / BATCH_SIZE);
    console.log(`\n[CODEX-EDITOR-NIGHT] ── BATCH ${batchNum}/${total} ──────────────────────────────`);

    for (const entry of batch) {
      const result = await editImage(entry);
      const idx    = updated.findIndex(e => e.id === entry.id);
      updated[idx] = result;
      writeFileSync(MANIFEST_OUT, JSON.stringify(updated, null, 2));
    }

    const ok  = batch.map(e => updated.find(u => u.id === e.id)).filter(e => e.status === 'SUCCESS').length;
    const bad = batch.length - ok;
    console.log(`[CODEX-EDITOR-NIGHT] BATCH ${batchNum} complete — ${ok} SUCCESS, ${bad} FAILED`);
  }

  const success = updated.filter(e => e.status === 'SUCCESS').length;
  const failed  = updated.filter(e => e.status === 'FAILED').length;
  console.log(`\n[CODEX-EDITOR-NIGHT] ═══ COMPLETE ════════════════════════════`);
  console.log(`[CODEX-EDITOR-NIGHT] ${updated.length} total | ${success} SUCCESS | ${failed} FAILED`);
}

main().catch(err => { console.error('[CODEX-EDITOR-NIGHT] FATAL:', err); process.exit(1); });

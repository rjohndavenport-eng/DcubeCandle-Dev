/**
 * CODEX-EDITOR v2 — Unified DAY + NIGHT batch processor
 *
 * Processes 16 products × 2 style modes = 32 images in a single run.
 * Output: _styled_v2/  2000×2000 WebP q=92
 *
 * Routing per entry:
 *   opaque >= 0.15 + NIGHT + candle  → callEditCandle  (lid strip + post-composite label lock)
 *   opaque >= 0.15 + anything else   → callEditStandard (full mask + post-composite label lock)
 *   opaque < 0.15                    → callGenerate    (glass fallback, no mask)
 *
 * Resume: if manifest.json exists in OUTPUT_DIR, only PENDING entries are processed.
 */

import 'dotenv/config';
import OpenAI, { toFile } from 'openai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, basename } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const EDIT_SIZE    = '1024x1024';
const OUTPUT_SIZE  = 2000;        // v2 spec: 2000×2000
const WEBP_QUALITY = 92;
const MIN_OPAQUE   = 0.15;
const LID_FRACTION = 0.18;        // top 18% of product bbox = lid zone (NIGHT candles)
const BATCH_SIZE   = 3;

const MANIFEST_SRC = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const OUTPUT_DIR   = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v2';
const MANIFEST_V2  = `${OUTPUT_DIR}/manifest.json`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Prompts ───────────────────────────────────────────────────────────────────

const LABEL_LOCK = `The product pixels are masked and must not be changed in any way. Only generate the background scene and any specified atmospheric elements. Do not redraw, reinterpret, smear, blur, or hallucinate any text, logo, label, or product surface. Every letter and marking must remain pixel-perfect as provided.`;

const PROMPTS = {

  candle_day: `
Premium luxury candle sitting on warm sun-drenched beach sand.
Bright coastal daylight — a clear cerulean sky with a few wisps of white cloud fading to the horizon.
Shallow depth-of-field bokeh on a calm turquoise ocean behind the product.
Warm golden sunlight bloom entering from the upper right corner, creating a soft halo.
The wooden lid rests naturally on top of the candle jar.
Small natural props arranged loosely at the base on the sand: one small starfish, one ridged seashell — positioned to the side so they never cover any label text.
Fine sun-bleached beach sand visible in the foreground with gentle ripple texture.
Photorealistic premium coastal lifestyle product photography. Ultra high quality. Soft cinematic lighting.
${LABEL_LOCK}
`.trim(),

  candle_night: `
Premium luxury candle sitting on warm beach sand at night.
The wooden lid has been removed and placed beside the jar on the sand, casting a small natural shadow.
The glass jar is open at the top and a beautiful living candle flame rises naturally from the open wax surface, flickering gently upward.
The flame casts a warm amber and honey-gold glow that spills across the surrounding sand, illuminates props, and faintly warms the lower half of the jar.
Deep navy and midnight blue night sky above, a near-full moon riding high and casting cool silver light on the calm ocean surface in the distance.
Slow, barely perceptible ocean waves catching the moonlight.
A small starfish and a ridged seashell rest in the sand beside the candle — lit from both the warm flame glow and cool moonlight simultaneously.
Romantic, intimate, premium nighttime lifestyle atmosphere.
Photorealistic cinematic nighttime product photography. Ultra high quality. Dual-light atmosphere: warm amber from flame, cool silver from moon.
${LABEL_LOCK}
`.trim(),

  diffuser_day: `
Premium luxury reed diffuser sitting on clean beach sand in bright coastal daylight.
Clear blue sky with soft horizon haze behind the product.
Shallow depth-of-field bokeh on calm turquoise ocean water.
Warm golden sunlight from the upper right creates a gentle rim light on the glass bottle.
The reed sticks are fanned elegantly in the diffuser, catching the sunlight.
A single small seashell rests on the sand at the base — never covering the label.
Photorealistic premium coastal lifestyle product photography. Ultra high quality. Crisp natural light.
${LABEL_LOCK}
`.trim(),

  diffuser_night: `
Premium luxury reed diffuser on warm beach sand at dusk, transitioning into night.
Deep blue and indigo evening sky with traces of violet and amber near the horizon where daylight fades.
Soft, diffused moonlight illuminates the scene from above.
The reed sticks cast elegant elongated shadows on the sand, silhouetted faintly against the dimming sky.
The glass bottle catches a subtle reflection of the evening sky.
Calm ocean in the background with a thin silver moonlight streak on the water surface.
Romantic premium dusk atmosphere. Photorealistic cinematic product photography. Ultra high quality.
${LABEL_LOCK}
`.trim(),

  room_spray_day: `
Premium luxury room spray bottle on a clean studio surface.
Pure white to warm cream gradient background — smooth, seamless, and perfectly even.
Bright clean studio lighting from upper left, creating a soft shadow on the right side.
A secondary gentle fill light from the right ensures no harsh darkness.
The glass bottle glows cleanly with precise specular highlights on its curves.
No props. Minimal, modern luxury composition.
Photorealistic premium studio product photography. Ultra high quality. White-box editorial style.
${LABEL_LOCK}
`.trim(),

  room_spray_night: `
Premium luxury room spray bottle on a deep charcoal studio surface.
Dark charcoal to near-black gradient background — dramatic and sophisticated.
Moody warm-toned studio lighting from upper left, casting a long elegant shadow to the right.
A subtle warm amber fill from the lower right prevents total darkness and gives depth.
The glass bottle has a refined specular highlight along its edge.
No props. Bold, minimal luxury editorial composition.
Photorealistic cinematic studio product photography. Ultra high quality. Dark luxury mood board aesthetic.
${LABEL_LOCK}
`.trim(),

};

function getPromptKey(category, styleMode) {
  const cat = category === 'candle' ? 'candle'
            : category === 'diffuser' ? 'diffuser'
            : 'room_spray';
  return `${cat}_${styleMode === 'DAY' ? 'day' : 'night'}`;
}

// ── Step 1: rembg extraction ──────────────────────────────────────────────────
async function extractForeground(inputPath) {
  const fileUrl = pathToFileURL(inputPath).href;
  const blob    = await removeBackground(fileUrl, {
    model:  'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 30) opaque++; }
  return { buf, opaqueFrac: opaque / (info.width * info.height) };
}

// ── Step 2: Pad to square PNG ─────────────────────────────────────────────────
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

// ── callEditStandard: DAY all + NIGHT non-candle ──────────────────────────────
//
// Preserve all product pixels. Post-composite label lock.
//
async function callEditStandard(squarePngBuf, prompt) {
  const { data, info } = await sharp(squarePngBuf).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });

  const hardened = Buffer.alloc(data.length);
  const maskData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const isProduct = data[i + 3] > 30;
    hardened[i]     = data[i];     hardened[i + 1] = data[i + 1];
    hardened[i + 2] = data[i + 2]; hardened[i + 3] = isProduct ? 255 : 0;
    maskData[i]     = 255;         maskData[i + 1] = 255;
    maskData[i + 2] = 255;         maskData[i + 3] = isProduct ? 255 : 0;
  }

  const hardenedPng = await sharp(hardened,
    { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const maskPng = await sharp(maskData,
    { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(hardenedPng, 'product.png', { type: 'image/png' }),
    mask:  await toFile(maskPng,     'mask.png',    { type: 'image/png' }),
    prompt, size: EDIT_SIZE, quality: 'high', n: 1,
  });
  const aiBuf = Buffer.from(response.data[0].b64_json, 'base64');

  // Post-composite: lock label/logo pixels from clean source
  return sharp(aiBuf).composite([{ input: hardenedPng, blend: 'over' }]).png().toBuffer();
}

// ── callEditCandle: NIGHT candles only ───────────────────────────────────────
//
// 1. Find product vertical bbox.
// 2. Top LID_FRACTION of bbox height → editable (AI generates flame + lid-on-sand).
// 3. Body below lid zone → preserve.
// 4. Post-composite label lock.
//
async function callEditCandle(squarePngBuf, prompt) {
  const { data, info } = await sharp(squarePngBuf).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });

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

  const hardened = Buffer.alloc(data.length);
  const maskData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const y         = Math.floor(i / 4 / W);
    const isProduct = data[i + 3] > 30;
    const preserve  = isProduct && y > lidCutRow;   // body only; lid zone is editable

    hardened[i]     = data[i];     hardened[i + 1] = data[i + 1];
    hardened[i + 2] = data[i + 2]; hardened[i + 3] = preserve ? 255 : 0;
    maskData[i]     = 255;         maskData[i + 1] = 255;
    maskData[i + 2] = 255;         maskData[i + 3] = preserve ? 255 : 0;
  }

  const hardenedPng = await sharp(hardened,
    { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const maskPng = await sharp(maskData,
    { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(hardenedPng, 'product.png', { type: 'image/png' }),
    mask:  await toFile(maskPng,     'mask.png',    { type: 'image/png' }),
    prompt, size: EDIT_SIZE, quality: 'high', n: 1,
  });
  const aiBuf = Buffer.from(response.data[0].b64_json, 'base64');

  // Post-composite: restore clean body pixels over AI result
  return sharp(aiBuf).composite([{ input: hardenedPng, blend: 'over' }]).png().toBuffer();
}

// ── callGenerate: glass/translucent fallback ──────────────────────────────────
async function callGenerate(inputPath, prompt) {
  const squareBuf = await sharp(readFileSync(inputPath))
    .resize(1024, 1024, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const response = await openai.images.edit({
    model:  'gpt-image-1',
    image:  await toFile(squareBuf, 'product.png', { type: 'image/png' }),
    prompt: `${prompt}\n\nReplace only the background. The product — including all text, labels, logo, and shape — must remain completely unchanged.`,
    size: EDIT_SIZE, quality: 'high', n: 1,
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

// ── Finalise: resize → 2000×2000 WebP ────────────────────────────────────────
async function finalise(imageBuf) {
  return sharp(imageBuf)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveOutputPath(srcEntry, styleMode) {
  const slug   = basename(srcEntry.output_path, '.webp');
  const suffix = styleMode === 'DAY' ? 'day' : 'night';
  return `${OUTPUT_DIR}/${slug}-${suffix}.webp`;
}

function buildV2Manifest(srcManifest) {
  const entries = [];
  for (const src of srcManifest) {
    for (const styleMode of ['DAY', 'NIGHT']) {
      entries.push({
        id:             `${src.id}-${styleMode.toLowerCase()}`,
        input_path:     src.input_path,
        output_path:    deriveOutputPath(src, styleMode),
        category:       src.category,
        style_mode:     styleMode,
        status:         'PENDING',
        prompt_used:    '',
        params_used:    '',
        failure_reason: '',
        notes:          '',
      });
    }
  }
  return entries;
}

// ── Core per-image processor ──────────────────────────────────────────────────
async function processEntry(entry) {
  const { id, input_path, category, style_mode } = entry;
  const prompt = PROMPTS[getPromptKey(category, style_mode)];

  console.log(`[EDITOR-V2] [${id}] [${basename(input_path)}] [${category}/${style_mode}] → processing`);

  try {
    const { buf: fgBuf, opaqueFrac } = await extractForeground(input_path);
    console.log(`[EDITOR-V2] [${id}] opaque: ${(opaqueFrac * 100).toFixed(1)}%`);

    let resultBuf, strategy;

    if (opaqueFrac >= MIN_OPAQUE) {
      const squarePng = await padToSquare(fgBuf);
      if (style_mode === 'NIGHT' && category === 'candle') {
        console.log(`[EDITOR-V2] [${id}] → callEditCandle (lid strip + label lock)`);
        strategy  = `rembg(medium) + gpt-image-1 candle-night (lid stripped, label locked), opaque=${(opaqueFrac*100).toFixed(0)}%`;
        resultBuf = await callEditCandle(squarePng, prompt);
      } else {
        console.log(`[EDITOR-V2] [${id}] → callEditStandard (label lock)`);
        strategy  = `rembg(medium) + gpt-image-1 edit (label locked), opaque=${(opaqueFrac*100).toFixed(0)}%`;
        resultBuf = await callEditStandard(squarePng, prompt);
      }
    } else {
      console.log(`[EDITOR-V2] [${id}] → generate fallback (glass/translucent)`);
      strategy  = `gpt-image-1 generate (original photo, opaque=${(opaqueFrac*100).toFixed(0)}%)`;
      resultBuf = await callGenerate(input_path, prompt);
    }

    const output = await finalise(resultBuf);
    const outDir = dirname(entry.output_path);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(entry.output_path, output);

    const sizeKB = Math.round(output.length / 1024);
    console.log(`[EDITOR-V2] [${id}] [${basename(entry.output_path)}] SUCCESS [${sizeKB} KB]`);

    return { ...entry, status: 'SUCCESS',
      prompt_used: prompt.slice(0, 120) + '…', params_used: strategy, failure_reason: '' };

  } catch (err) {
    console.error(`[EDITOR-V2] [${id}] FAILED: ${err.message}`);
    return { ...entry, status: 'FAILED', failure_reason: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[EDITOR-V2] OPENAI_API_KEY not set'); process.exit(1);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let manifest;
  if (existsSync(MANIFEST_V2)) {
    manifest = JSON.parse(readFileSync(MANIFEST_V2, 'utf8'));
    console.log(`[EDITOR-V2] Resuming from existing manifest (${manifest.length} entries)`);
  } else {
    const src = JSON.parse(readFileSync(MANIFEST_SRC, 'utf8'));
    manifest  = buildV2Manifest(src);
    writeFileSync(MANIFEST_V2, JSON.stringify(manifest, null, 2));
    console.log(`[EDITOR-V2] Created v2 manifest: ${manifest.length} entries (${manifest.length / 2} products × 2 modes)`);
  }

  const pending = manifest.filter(e => e.status === 'PENDING');
  console.log(`[EDITOR-V2] ${pending.length} PENDING | output: ${OUTPUT_SIZE}×${OUTPUT_SIZE} WebP q=${WEBP_QUALITY}`);

  if (pending.length === 0) {
    console.log('[EDITOR-V2] Nothing to do — all entries resolved.'); return;
  }

  const updated = [...manifest];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch    = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total    = Math.ceil(pending.length / BATCH_SIZE);
    console.log(`\n[EDITOR-V2] ── BATCH ${batchNum}/${total} ──────────────────────────────────────`);

    for (const entry of batch) {
      const result = await processEntry(entry);
      const idx    = updated.findIndex(e => e.id === entry.id);
      updated[idx] = result;
      writeFileSync(MANIFEST_V2, JSON.stringify(updated, null, 2));
    }

    const batchRes = batch.map(e => updated.find(u => u.id === e.id));
    const ok  = batchRes.filter(e => e.status === 'SUCCESS').length;
    const bad = batchRes.filter(e => e.status === 'FAILED').length;
    console.log(`[EDITOR-V2] BATCH ${batchNum} complete — ${ok} SUCCESS, ${bad} FAILED`);
  }

  const success = updated.filter(e => e.status === 'SUCCESS').length;
  const failed  = updated.filter(e => e.status === 'FAILED').length;
  console.log(`\n[EDITOR-V2] ═══ COMPLETE ══════════════════════════════════════`);
  console.log(`[EDITOR-V2] ${updated.length} total | ${success} SUCCESS | ${failed} FAILED`);

  if (failed > 0) {
    console.log('\n[EDITOR-V2] FAILURES:');
    updated.filter(e => e.status === 'FAILED').forEach(e =>
      console.log(`  [${e.id}] ${basename(e.input_path)} [${e.category}/${e.style_mode}] — ${e.failure_reason}`)
    );
  }
}

main().catch(err => { console.error('[EDITOR-V2] FATAL:', err); process.exit(1); });

/**
 * CODEX-EDITOR v3 — "No Sticker / No Double Candle" Lockdown
 *
 * KEY CHANGE vs v1/v2:
 *   The root cause of the "sticker / photo-on-photo" look was sending the
 *   rembg-extracted transparent cutout as the image input to gpt-image-1.
 *   gpt-image-1 would generate a full background candle scene, then we pasted
 *   the cutout on top → sticker edges, double candle, mismatched lighting.
 *
 *   v3 fix:
 *   - Send the ORIGINAL PHOTO (fully opaque) as the image input.
 *   - Use rembg only to DERIVE THE MASK (product = preserve, background = edit).
 *   - gpt-image-1 generates the background while preserving original product pixels.
 *   - NO post-composite. No pasting. No cutout edges.
 *   - For NIGHT candles: lid zone in the mask is made transparent so AI generates
 *     a flame there (same bounding-box lid-strip logic as v2).
 *
 * Output: _styled_v3/  2000×2000 WebP q=92
 * Batch rule: MAX_IMAGES controls how many to process per run (default: 2 for test).
 *             Set MAX_IMAGES=0 to process all remaining PENDING entries.
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
const OUTPUT_SIZE  = 2000;
const WEBP_QUALITY = 92;
const MIN_OPAQUE   = 0.15;
const LID_FRACTION = 0.18;
const BATCH_SIZE   = 3;

// Set MAX_IMAGES to a number to limit this run (for test batches of 2 products = 4 entries).
// 0 = process all PENDING.
const MAX_IMAGES   = 2;

const MANIFEST_SRC = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const OUTPUT_DIR   = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v3';
const MANIFEST_V3  = `${OUTPUT_DIR}/manifest.json`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Prompts ───────────────────────────────────────────────────────────────────
//
// v3 required verbatim guardrails appended to every prompt:
//
const GUARDRAILS = `
Exactly ONE candle jar in the scene. Do not include a second candle, duplicate product, or background candle of any kind.
Preserve all label text exactly as in the original. Do not change any letters, words, or fonts. No retyping. No hallucinations.
The label must look physically wrapped to the jar curvature and inherit realistic scene lighting. No flat sticker look. No pasted edges.
`.trim();

const PROMPTS = {

  candle_day: `
Premium luxury candle on warm beach sand in bright coastal daylight.
Clear cerulean sky, soft white clouds on the horizon. Shallow depth-of-field bokeh on turquoise ocean behind the product.
Warm golden sunlight from upper right, soft halo and rim light on the jar.
Wooden lid rests naturally on top of the candle jar. The jar glass catches clean specular highlights.
Small natural props loosely beside the jar base: one small starfish and one ridged seashell resting on sand — never covering label text.
Fine sun-bleached sand foreground with gentle ripple texture.
Photorealistic premium coastal lifestyle product photography. Cinematic soft lighting. Ultra high quality.
${GUARDRAILS}
`.trim(),

  candle_night: `
Premium luxury candle on warm beach sand at night.
The wooden lid has been removed from the jar and rests in the sand nearby at a natural angle, casting a small shadow.
A living candle flame rises from the open wax surface inside the jar at the top, flickering naturally upward.
Warm amber and honey-gold candlelight spills across the sand, glows through the glass jar, and illuminates nearby props.
Deep navy and midnight blue night sky, near-full moon above casting cool silver light on calm ocean in the distance.
Slow moonlit ocean waves in background. A small starfish and ridged seashell rest beside the jar in dual-lit sand.
Romantic, intimate, premium nighttime lifestyle atmosphere.
Photorealistic cinematic nighttime product photography. Dual light: warm amber flame + cool silver moonlight. Ultra high quality.
If candle is lit, lid must be off and placed nearby; flame from wick inside jar.
${GUARDRAILS}
`.trim(),

  diffuser_day: `
Premium luxury reed diffuser on clean beach sand in bright coastal daylight.
Clear blue sky, soft horizon haze. Shallow bokeh on calm turquoise ocean behind the product.
Warm golden sunlight from upper right creates a gentle rim light on the glass bottle.
Reed sticks fanned elegantly in the diffuser, catching warm sunlight.
One small seashell in the sand beside the base — never covering label.
Photorealistic premium coastal lifestyle product photography. Crisp natural light. Ultra high quality.
${GUARDRAILS}
`.trim(),

  diffuser_night: `
Premium luxury reed diffuser on warm beach sand at dusk.
Deep blue and indigo evening sky, traces of violet and amber near the horizon.
Soft diffused moonlight illuminates the scene. Reed sticks cast elongated shadows on sand.
Glass bottle catches a subtle reflection of the evening sky.
Calm ocean in background with a thin silver moonlight streak on water.
Photorealistic cinematic dusk product photography. Ultra high quality.
${GUARDRAILS}
`.trim(),

  room_spray_day: `
Premium luxury room spray bottle on a clean studio surface.
Pure white to warm cream gradient background — smooth, seamless, perfectly even.
Bright clean studio lighting from upper left, soft shadow on right side.
Glass bottle has precise specular highlights on its curves.
No props. Minimal modern luxury composition.
Photorealistic premium studio product photography. White-box editorial style. Ultra high quality.
${GUARDRAILS}
`.trim(),

  room_spray_night: `
Premium luxury room spray bottle on a deep charcoal studio surface.
Dark charcoal to near-black gradient background — dramatic and sophisticated.
Moody warm-toned studio lighting from upper left, long elegant shadow to the right.
Subtle warm amber fill from lower right gives depth. Refined specular highlight on bottle edge.
No props. Bold minimal luxury editorial composition.
Photorealistic cinematic studio product photography. Ultra high quality.
${GUARDRAILS}
`.trim(),

};

function getPromptKey(category, styleMode) {
  const cat = category === 'diffuser' ? 'diffuser'
            : category === 'room_spray' ? 'room_spray'
            : 'candle';
  return `${cat}_${styleMode === 'DAY' ? 'day' : 'night'}`;
}

// ── Step 1: Build mask from rembg (for mask derivation only) ──────────────────
async function buildMask(inputPath) {
  const fileUrl = pathToFileURL(inputPath).href;
  const blob    = await removeBackground(fileUrl, {
    model:  'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  // Measure opaque fraction
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i] > 30) opaque++; }
  return { fgBuf: buf, opaqueFrac: opaque / (info.width * info.height) };
}

// ── Step 2a: Square the ORIGINAL photo (no alpha, fully opaque) ───────────────
//
// This is the image we send to gpt-image-1. Using the original (not rembg extract)
// means the product pixels have no cutout edges and no floating-product look.
//
async function squareOriginal(inputPath, size = 1024) {
  return sharp(readFileSync(inputPath))
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

// ── Step 2b: Square the rembg fg (for mask extraction only) ──────────────────
async function squareFg(fgBuf, size = 1024) {
  return sharp(fgBuf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

// ── Step 3a: Build standard mask (full product = preserve) ────────────────────
async function buildStandardMask(fgBuf, size = 1024) {
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

// ── Step 3b: Build lid-stripped mask for NIGHT candles ────────────────────────
//
// Top LID_FRACTION of product bbox → transparent in mask (AI generates flame there).
// Body below lid → opaque in mask (original product pixels preserved).
//
async function buildCandleNightMask(fgBuf, size = 1024) {
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
    const y         = Math.floor(i / 4 / W);
    const isProduct = data[i + 3] > 30;
    // Preserve only product pixels BELOW the lid cut line
    const preserve  = isProduct && y > lidCutRow;

    maskData[i]     = 255;
    maskData[i + 1] = 255;
    maskData[i + 2] = 255;
    maskData[i + 3] = preserve ? 255 : 0;
  }

  return sharp(maskData, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
}

// ── Step 4: Call gpt-image-1 edit (original photo + mask) ────────────────────
//
// CRITICAL: `image` = original photo (opaque). `mask` = rembg-derived mask.
// gpt-image-1 generates where mask is transparent; preserves where opaque.
// No rembg cutout is sent as the image. No post-composite.
//
async function callEdit(originalPng, maskPng, prompt) {
  const response = await openai.images.edit({
    model:   'gpt-image-1',
    image:   await toFile(originalPng, 'product.png', { type: 'image/png' }),
    mask:    await toFile(maskPng,     'mask.png',    { type: 'image/png' }),
    prompt,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

// ── Step 4b: Glass fallback (very low opaque fraction) ───────────────────────
async function callGenerate(originalPng, prompt) {
  const response = await openai.images.edit({
    model:   'gpt-image-1',
    image:   await toFile(originalPng, 'product.png', { type: 'image/png' }),
    prompt:  `${prompt}\nReplace only the background with the described scene. The product — all text, labels, logo, and shape — must remain completely unchanged.`,
    size:    EDIT_SIZE,
    quality: 'high',
    n:       1,
  });
  return Buffer.from(response.data[0].b64_json, 'base64');
}

// ── Step 5: Finalise → 2000×2000 WebP ────────────────────────────────────────
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

function buildV3Manifest(srcManifest) {
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

  console.log(`[EDITOR-V3] [${id}] [${basename(input_path)}] [${category}/${style_mode}]`);

  try {
    // 1. Build mask from rembg (mask-only, not used as image input)
    console.log(`[EDITOR-V3] [${id}] building rembg mask…`);
    const { fgBuf, opaqueFrac } = await buildMask(input_path);
    console.log(`[EDITOR-V3] [${id}] opaque: ${(opaqueFrac * 100).toFixed(1)}%`);

    // 2. Square the ORIGINAL photo for the image input
    const originalPng = await squareOriginal(input_path);

    let resultBuf, strategy;

    if (opaqueFrac >= MIN_OPAQUE) {
      let maskPng;
      if (style_mode === 'NIGHT' && category === 'candle') {
        // Lid-stripped mask: lid zone is editable → AI generates flame
        console.log(`[EDITOR-V3] [${id}] → candle-night edit (lid strip mask, original photo)`);
        maskPng  = await buildCandleNightMask(fgBuf);
        strategy = `original-photo + gpt-image-1 (lid-stripped mask), opaque=${(opaqueFrac*100).toFixed(0)}%`;
      } else {
        // Standard mask: full product = preserve
        console.log(`[EDITOR-V3] [${id}] → standard edit (original photo + rembg mask)`);
        maskPng  = await buildStandardMask(fgBuf);
        strategy = `original-photo + gpt-image-1 (rembg mask), opaque=${(opaqueFrac*100).toFixed(0)}%`;
      }
      // Send ORIGINAL photo (not rembg cutout) + mask
      resultBuf = await callEdit(originalPng, maskPng, prompt);

    } else {
      // Glass/translucent fallback: send original, ask for background replace
      console.log(`[EDITOR-V3] [${id}] → generate fallback (glass/translucent)`);
      strategy  = `gpt-image-1 generate (original photo, opaque=${(opaqueFrac*100).toFixed(0)}%)`;
      resultBuf = await callGenerate(originalPng, prompt);
    }

    const output = await finalise(resultBuf);
    const outDir = dirname(entry.output_path);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(entry.output_path, output);

    const sizeKB = Math.round(output.length / 1024);
    console.log(`[EDITOR-V3] [${id}] [${basename(entry.output_path)}] SUCCESS [${sizeKB} KB]`);

    return { ...entry, status: 'SUCCESS',
      prompt_used: prompt.slice(0, 140) + '…', params_used: strategy, failure_reason: '' };

  } catch (err) {
    console.error(`[EDITOR-V3] [${id}] FAILED: ${err.message}`);
    return { ...entry, status: 'FAILED', failure_reason: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('[EDITOR-V3] OPENAI_API_KEY not set'); process.exit(1);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let manifest;
  if (existsSync(MANIFEST_V3)) {
    manifest = JSON.parse(readFileSync(MANIFEST_V3, 'utf8'));
    console.log(`[EDITOR-V3] Resuming from existing manifest (${manifest.length} entries)`);
  } else {
    const src = JSON.parse(readFileSync(MANIFEST_SRC, 'utf8'));
    manifest  = buildV3Manifest(src);
    writeFileSync(MANIFEST_V3, JSON.stringify(manifest, null, 2));
    console.log(`[EDITOR-V3] Created v3 manifest: ${manifest.length} entries`);
  }

  let pending = manifest.filter(e => e.status === 'PENDING');
  if (MAX_IMAGES > 0) {
    pending = pending.slice(0, MAX_IMAGES);
    console.log(`[EDITOR-V3] TEST MODE: processing first ${MAX_IMAGES} of ${manifest.filter(e => e.status === 'PENDING').length} PENDING`);
  } else {
    console.log(`[EDITOR-V3] ${pending.length} PENDING | output: ${OUTPUT_SIZE}×${OUTPUT_SIZE}`);
  }

  if (pending.length === 0) {
    console.log('[EDITOR-V3] Nothing to do.'); return;
  }

  const updated = [...manifest];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch    = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total    = Math.ceil(pending.length / BATCH_SIZE);
    console.log(`\n[EDITOR-V3] ── BATCH ${batchNum}/${total} ────────────────────────────────`);

    for (const entry of batch) {
      const result = await processEntry(entry);
      const idx    = updated.findIndex(e => e.id === entry.id);
      updated[idx] = result;
      writeFileSync(MANIFEST_V3, JSON.stringify(updated, null, 2));
    }

    const batchRes = batch.map(e => updated.find(u => u.id === e.id));
    const ok  = batchRes.filter(e => e.status === 'SUCCESS').length;
    const bad = batchRes.filter(e => e.status === 'FAILED').length;
    console.log(`[EDITOR-V3] BATCH ${batchNum} complete — ${ok} SUCCESS, ${bad} FAILED`);
  }

  const success = updated.filter(e => e.status === 'SUCCESS').length;
  const failed  = updated.filter(e => e.status === 'FAILED').length;
  const stillPending = updated.filter(e => e.status === 'PENDING').length;
  console.log(`\n[EDITOR-V3] ═══ RUN COMPLETE ═══════════════════════════════════`);
  console.log(`[EDITOR-V3] ${success} SUCCESS | ${failed} FAILED | ${stillPending} still PENDING`);
  if (stillPending > 0) {
    console.log(`[EDITOR-V3] → review outputs, then run again to continue next batch`);
  }
}

main().catch(err => { console.error('[EDITOR-V3] FATAL:', err); process.exit(1); });

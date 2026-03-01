/**
 * CODEX-EDITOR
 * Batch background removal + styled compositing for DCube product images.
 *
 * Pipeline per image:
 *   1. removeBackground() → product on transparent RGBA PNG (in-memory)
 *   2. generateBackground()  → 2000×2000 Sharp instance matching variant
 *   3. Composite product: centered, scaled to target height ratio
 *   4. Export 2000×2000 WebP @ q=92
 *   5. Update manifest.json entry (status, prompt_used, params_used, failure_reason)
 *
 * Variants:
 *   coastal_lifestyle — warm sand (bottom 45%) + soft sky (top 55%) + bokeh overlay
 *   clean_studio      — cream/off-white radial gradient, subtle soft shadow under product
 */

import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { pathToFileURL } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────
const OUTPUT_SIZE  = 2000;           // px, square
const WEBP_QUALITY = 92;

// Product framing targets (as fraction of OUTPUT_SIZE height)
const FRAME = {
  candle:     { minH: 0.70, maxH: 0.80 },
  diffuser:   { minH: 0.60, maxH: 0.75 },
  room_spray: { minH: 0.65, maxH: 0.78 },
  gift_set:   { minH: 0.65, maxH: 0.78 },
};
const DEFAULT_FRAME = { minH: 0.65, maxH: 0.78 };

// DCube brand palette
const BRAND = {
  offWhite:   { r: 250, g: 249, b: 246 },   // #faf9f6
  cream:      { r: 245, g: 240, b: 228 },   // warm cream
  sandLight:  { r: 232, g: 210, b: 175 },   // pale sand
  sandMid:    { r: 196, g: 165, b: 120 },   // mid sand
  skyLight:   { r: 188, g: 214, b: 225 },   // coastal sky
  skyMid:     { r: 155, g: 192, b: 210 },   // deeper sky
  skyDeep:    { r: 124, g: 168, b: 195 },   // horizon line
};

// ── Paths ─────────────────────────────────────────────────────────────────────
const MANIFEST_PATH = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';

// ── Background generators ─────────────────────────────────────────────────────

/**
 * COASTAL LIFESTYLE background
 * Sky-to-horizon gradient top 55%, warm sand bottom 45%.
 * A soft radial blur ellipse simulates bokeh/light bloom near the horizon.
 */
async function makeCoastalBackground() {
  const S = OUTPUT_SIZE;

  // Sky gradient: top row = skyDeep, horizon row = skyLight
  // Sand gradient: horizon row = sandLight, bottom row = sandMid
  // Build as SVG then rasterize — gives smooth linear gradients with no banding.
  const horizonY = Math.round(S * 0.52);  // horizon line

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="rgb(${BRAND.skyDeep.r},${BRAND.skyDeep.g},${BRAND.skyDeep.b})"/>
        <stop offset="100%" stop-color="rgb(${BRAND.skyLight.r},${BRAND.skyLight.g},${BRAND.skyLight.b})"/>
      </linearGradient>
      <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="rgb(${BRAND.sandLight.r},${BRAND.sandLight.g},${BRAND.sandLight.b})"/>
        <stop offset="100%" stop-color="rgb(${BRAND.sandMid.r},${BRAND.sandMid.g},${BRAND.sandMid.b})"/>
      </linearGradient>
      <!-- warm golden bloom at horizon -->
      <radialGradient id="bloom" cx="50%" cy="${Math.round(horizonY / S * 100)}%" r="60%">
        <stop offset="0%"   stop-color="rgb(255,235,190)" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="rgb(255,235,190)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- sky -->
    <rect x="0" y="0" width="${S}" height="${horizonY}" fill="url(#sky)"/>
    <!-- sand -->
    <rect x="0" y="${horizonY}" width="${S}" height="${S - horizonY}" fill="url(#sand)"/>
    <!-- horizon bloom -->
    <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bloom)"/>
  </svg>`;

  // Rasterize SVG → apply subtle gaussian blur to simulate depth-of-field in background
  const bg = await sharp(Buffer.from(svg))
    .resize(S, S)
    .blur(6)   // soft bokeh on background before product is composited
    .toBuffer();

  return bg;
}

/**
 * CLEAN STUDIO background
 * Off-white radial gradient (center brighter, edges slightly warmer).
 * Soft shadow ellipse at bottom center.
 */
async function makeStudioBackground() {
  const S = OUTPUT_SIZE;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <radialGradient id="studio" cx="50%" cy="42%" r="65%">
        <stop offset="0%"   stop-color="rgb(255,254,252)"/>
        <stop offset="60%"  stop-color="rgb(${BRAND.offWhite.r},${BRAND.offWhite.g},${BRAND.offWhite.b})"/>
        <stop offset="100%" stop-color="rgb(${BRAND.cream.r},${BRAND.cream.g},${BRAND.cream.b})"/>
      </radialGradient>
      <!-- drop shadow ellipse at base -->
      <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="rgb(180,170,155)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="rgb(180,170,155)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${S}" height="${S}" fill="url(#studio)"/>
    <!-- ground shadow -->
    <ellipse cx="${S/2}" cy="${Math.round(S * 0.875)}" rx="${Math.round(S*0.28)}" ry="${Math.round(S*0.06)}"
             fill="url(#shadow)"/>
  </svg>`;

  const bg = await sharp(Buffer.from(svg))
    .resize(S, S)
    .blur(2)
    .toBuffer();

  return bg;
}

// ── Scale product to fit framing target ──────────────────────────────────────

function computeProductScale(productW, productH, category) {
  const frame = FRAME[category] || DEFAULT_FRAME;
  const targetH = OUTPUT_SIZE * ((frame.minH + frame.maxH) / 2);
  const scale   = targetH / productH;

  const scaledW = Math.round(productW * scale);
  const scaledH = Math.round(productH * scale);

  // Safety: never exceed OUTPUT_SIZE
  const clampedW = Math.min(scaledW, OUTPUT_SIZE - 20);
  const clampedH = Math.min(scaledH, OUTPUT_SIZE - 20);

  return { width: clampedW, height: clampedH };
}

// ── Core edit function ────────────────────────────────────────────────────────

async function editImage(entry) {
  const { id, input_path, output_path, category, variant } = entry;

  console.log(`[CODEX-EDITOR] [${id}] [${input_path.split('/').pop()}] [${variant}] → processing`);

  try {
    // 1. Convert Windows path to file:// URL so rembg can detect MIME type from extension
    const inputFileUrl = pathToFileURL(input_path).href;

    // Remove background → returns a Blob; convert to Buffer for sharp
    console.log(`[CODEX-EDITOR] [${id}] removing background…`);
    const fgBlob = await removeBackground(inputFileUrl, {
      model: 'small',           // 'small' = fastest, still very accurate for product shots
      output: {
        format: 'image/png',
        quality: 1,
      },
    });
    const fgBuffer = Buffer.from(await fgBlob.arrayBuffer());

    // 2. Get product dimensions from the extracted foreground
    const fgMeta   = await sharp(fgBuffer).metadata();
    const { width: fgW, height: fgH } = fgMeta;

    // 3. Scale to framing target
    const { width: scaledW, height: scaledH } = computeProductScale(fgW, fgH, category);
    const fgScaled = await sharp(fgBuffer)
      .resize(scaledW, scaledH, { fit: 'fill' })
      .toBuffer();

    // 4. Generate background
    const bgBuffer = variant === 'coastal_lifestyle'
      ? await makeCoastalBackground()
      : await makeStudioBackground();

    // 5. Composite: center product on background
    const left = Math.round((OUTPUT_SIZE - scaledW) / 2);
    const top  = Math.round((OUTPUT_SIZE - scaledH) / 2);

    // For candles/diffusers: shift slightly upward (visual weight centers better below midpoint)
    const verticalOffset = category === 'candle' ? Math.round(OUTPUT_SIZE * 0.03) : 0;

    const composite = await sharp(bgBuffer)
      .composite([{
        input: fgScaled,
        left,
        top: top - verticalOffset,
      }])
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // 6. Write output
    const outDir = dirname(output_path);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    writeFileSync(output_path, composite);

    console.log(`[CODEX-EDITOR] [${id}] [${output_path.split('/').pop()}] [${variant}] SUCCESS [${output_path}]`);

    return {
      ...entry,
      status: 'SUCCESS',
      prompt_used: `rembg(model=small) + ${variant} background + composite(center, vertOffset=${verticalOffset})`,
      params_used: `OUTPUT_SIZE=${OUTPUT_SIZE}, WEBP_QUALITY=${WEBP_QUALITY}, scale=${(scaledH/OUTPUT_SIZE).toFixed(2)} of frame`,
      failure_reason: '',
    };

  } catch (err) {
    console.error(`[CODEX-EDITOR] [${id}] FAILED: ${err.message}`);
    return {
      ...entry,
      status: 'FAILED',
      prompt_used: '',
      params_used: '',
      failure_reason: err.message,
    };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const pending  = manifest.filter(e => e.status === 'PENDING');

  console.log(`[CODEX-EDITOR] ${pending.length} PENDING entries to process (${manifest.length} total)`);

  // Process in batches of 5
  const BATCH_SIZE = 5;
  const updated    = [...manifest];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch     = pending.slice(i, i + BATCH_SIZE);
    const batchNum  = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);

    console.log(`\n[CODEX-EDITOR] ── BATCH ${batchNum}/${totalBatches} ──────────────────────────────`);

    // Run batch sequentially (rembg is memory-intensive; parallel causes OOM on some machines)
    for (const entry of batch) {
      const result = await editImage(entry);
      const idx = updated.findIndex(e => e.id === entry.id);
      updated[idx] = result;

      // Flush manifest after every image so partial runs are resumable
      writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2));
    }

    const batchResults = batch.map(e => updated.find(u => u.id === e.id));
    const successes    = batchResults.filter(e => e.status === 'SUCCESS').length;
    const failures     = batchResults.filter(e => e.status === 'FAILED').length;
    console.log(`[CODEX-EDITOR] BATCH ${batchNum} complete — ${successes} SUCCESS, ${failures} FAILED`);
  }

  const total    = updated.length;
  const success  = updated.filter(e => e.status === 'SUCCESS').length;
  const failed   = updated.filter(e => e.status === 'FAILED').length;
  const skipped  = updated.filter(e => e.status === 'PENDING').length;

  console.log(`\n[CODEX-EDITOR] ═══ COMPLETE ════════════════════════════════════════`);
  console.log(`[CODEX-EDITOR] ${total} total | ${success} SUCCESS | ${failed} FAILED | ${skipped} PENDING/SKIPPED`);

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

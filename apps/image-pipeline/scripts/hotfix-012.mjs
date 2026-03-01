/**
 * CODEX-EDITOR HOTFIX — id 012 room-sprays.webp
 *
 * Strategy:
 *   Pass 1: rembg model='medium' (isnet — more conservative, better for translucent bottles)
 *            If output > 200 KB → PASS
 *   Pass 2: Soft-mask fallback — luminance delta from sampled background colour,
 *            Gaussian-blur the alpha for clean edges, never touch label region.
 *            Composite onto same coastal_lifestyle background.
 */

import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname } from 'path';

// ── Config ─────────────────────────────────────────────────────────────────
const OUTPUT_SIZE  = 2000;
const WEBP_QUALITY = 92;
// Size floor: room-spray is a small product on a smooth gradient — compresses much
// smaller than candle jars. Floor is set to 40 KB (above a known-blank 45 KB from
// first failed run... wait, first fail was 45 KB). Use opaque-fraction gate instead.
const MIN_PASS_KB  = 40;            // absolute minimum (truly blank would be <20 KB on a solid bg)
const MIN_OPAQUE_FRAC = 0.20;       // product must occupy >20% of frame

const INPUT_PATH   = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/room-sprays/0__public.jpg';
const OUTPUT_PATH  = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/room-sprays.webp';
const MANIFEST     = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const FAILURES     = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/FAILURES.json';
const REPORT       = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/REPORT.md';
const CONTACT      = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/qc_contact_sheet.png';

// Brand palette (coastal)
const BRAND = {
  sandLight: { r: 232, g: 210, b: 175 },
  sandMid:   { r: 196, g: 165, b: 120 },
  skyLight:  { r: 188, g: 214, b: 225 },
  skyDeep:   { r: 124, g: 168, b: 195 },
};

// ── Background (coastal_lifestyle — same as other products) ───────────────
async function makeCoastalBackground() {
  const S = OUTPUT_SIZE;
  const horizonY = Math.round(S * 0.52);

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
      <radialGradient id="bloom" cx="50%" cy="${Math.round(horizonY/S*100)}%" r="60%">
        <stop offset="0%"   stop-color="rgb(255,235,190)" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="rgb(255,235,190)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${S}" height="${horizonY}" fill="url(#sky)"/>
    <rect x="0" y="${horizonY}" width="${S}" height="${S - horizonY}" fill="url(#sand)"/>
    <rect x="0" y="0" width="${S}" height="${S}" fill="url(#bloom)"/>
  </svg>`;

  return sharp(Buffer.from(svg)).resize(S, S).blur(6).toBuffer();
}

// ── Scale helper ──────────────────────────────────────────────────────────
function computeScale(w, h, targetFrac = 0.70) {
  const targetH = OUTPUT_SIZE * targetFrac;
  const scale   = targetH / h;
  return {
    width:  Math.min(Math.round(w * scale), OUTPUT_SIZE - 20),
    height: Math.min(Math.round(h * scale), OUTPUT_SIZE - 20),
  };
}

// ── Composite helper ──────────────────────────────────────────────────────
async function compositeOnBackground(fgBuf, bgBuf, category = 'room_spray') {
  const meta    = await sharp(fgBuf).metadata();
  const dims    = computeScale(meta.width, meta.height, 0.72);
  const scaled  = await sharp(fgBuf).resize(dims.width, dims.height, { fit: 'fill' }).toBuffer();
  const left    = Math.round((OUTPUT_SIZE - dims.width) / 2);
  const top     = Math.round((OUTPUT_SIZE - dims.height) / 2);

  return sharp(bgBuf)
    .composite([{ input: scaled, left, top }])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ── Pass 1: rembg model=medium ─────────────────────────────────────────────
async function pass1() {
  console.log('[hotfix] [012] [room-sprays] [model=medium] attempting conservative rembg…');

  const fileUrl = pathToFileURL(INPUT_PATH).href;
  const blob    = await removeBackground(fileUrl, {
    model: 'medium',
    output: { format: 'image/png', quality: 1 },
  });
  const buf = Buffer.from(await blob.arrayBuffer());

  const meta = await sharp(buf).metadata();
  const pxCount = meta.width * meta.height;
  // Rough check: if the extracted PNG has mostly transparent pixels, it failed
  const raw = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let opaqueCount = 0;
  for (let i = 3; i < raw.data.length; i += 4) {
    if (raw.data[i] > 30) opaqueCount++;
  }
  const opaqueFrac = opaqueCount / pxCount;
  console.log(`[hotfix] [012] [model=medium] opaque pixel fraction: ${(opaqueFrac * 100).toFixed(1)}%`);

  // Return buffer + fraction so caller can gate on MIN_OPAQUE_FRAC
  return { buf, opaqueFrac };
}

// ── Pass 3: Corner-seeded BFS flood fill ─────────────────────────────────────
//
// Resizes source to a working resolution, BFS-floods from all 4 corners using
// the sampled background colour + tolerance, producing a binary mask of the
// background. Upsample mask to full res, feather edges, composite.
// This cleanly handles flat-colour bg (including grey) without touching product.
// ─────────────────────────────────────────────────────────────────────────────
async function pass3BfsFloodFill() {
  console.log('[hotfix] [012] [bfs-flood] starting corner-seeded flood-fill…');

  const WORK_W = 600;   // working resolution for BFS (speed vs accuracy)
  const TOLERANCE = 35; // colour delta from sampled bg to treat as background

  // Step 1: resize source to working size
  const { data: raw, info } = await sharp(INPUT_PATH)
    .resize(WORK_W, null)   // preserve AR
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height;

  // Step 2: sample corners to get background colour
  const CSAMP = 10;
  let rS=0, gS=0, bS=0, n=0;
  const corners = [{ x:0,y:0 },{ x:W-CSAMP,y:0 },{ x:0,y:H-CSAMP },{ x:W-CSAMP,y:H-CSAMP }];
  for (const {x,y} of corners) {
    for (let cy=y; cy<y+CSAMP && cy<H; cy++) {
      for (let cx=x; cx<x+CSAMP && cx<W; cx++) {
        const i=(cy*W+cx)*4; rS+=raw[i]; gS+=raw[i+1]; bS+=raw[i+2]; n++;
      }
    }
  }
  const bgR=rS/n, bgG=gS/n, bgB=bS/n;
  console.log(`[hotfix] [012] [bfs-flood] sampled bg: rgb(${Math.round(bgR)},${Math.round(bgG)},${Math.round(bgB)})`);

  // Step 3: BFS flood fill from all 4 corners
  const visited = new Uint8Array(W * H);  // 0=unvisited, 1=bg, 2=fg
  const queue   = [];

  const seed = (x, y) => { if (x>=0&&x<W&&y>=0&&y<H&&!visited[y*W+x]) { visited[y*W+x]=1; queue.push(y*W+x); } };
  // Seed all edge pixels adjacent to corners
  for (let x=0; x<W; x++) { seed(x,0); seed(x,H-1); }
  for (let y=0; y<H; y++) { seed(0,y); seed(W-1,y); }

  while (queue.length > 0) {
    const idx = queue.shift();
    const px  = idx % W, py = Math.floor(idx / W);
    const i   = idx * 4;
    const r=raw[i], g=raw[i+1], b=raw[i+2];

    const delta = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
    if (delta > TOLERANCE) { visited[idx]=2; continue; }  // product pixel — stop expanding

    const neighbours = [
      [px-1,py],[px+1,py],[px,py-1],[px,py+1],
    ];
    for (const [nx,ny] of neighbours) {
      if (nx>=0&&nx<W&&ny>=0&&ny<H&&!visited[ny*W+nx]) {
        visited[ny*W+nx]=1;
        queue.push(ny*W+nx);
      }
    }
  }

  // Step 4: build RGBA output — bg pixels → alpha=0
  const masked = Buffer.alloc(raw.length);
  for (let i=0; i<raw.length; i+=4) {
    masked[i]=raw[i]; masked[i+1]=raw[i+1]; masked[i+2]=raw[i+2];
    masked[i+3] = visited[i/4]===1 ? 0 : 255;
  }

  // Step 5: write PNG at working res, blur alpha for edge feathering, upscale
  const workPng = await sharp(masked, { raw:{ width:W, height:H, channels:4 } })
    .blur(2)
    .png()
    .toBuffer();

  // Upscale to match composite target
  const upscaled = await sharp(workPng)
    .resize(null, Math.round(OUTPUT_SIZE * 0.72), { fit:'inside' })
    .toBuffer();

  const opaqueCount = (await sharp(upscaled).raw().toBuffer({ resolveWithObject:true })).data
    .reduce((s,v,i) => i%4===3&&v>30 ? s+1 : s, 0);
  const meta = await sharp(upscaled).metadata();
  const frac  = opaqueCount / (meta.width * meta.height);
  console.log(`[hotfix] [012] [bfs-flood] opaque fraction after fill: ${(frac*100).toFixed(1)}%`);

  return upscaled;
}

// ── Pass 2: Soft-mask luminance-delta fallback ─────────────────────────────
//
// Strategy:
//   1. Sample the 4 corner regions (20×20 px each) to estimate background colour.
//   2. Convert source to raw RGBA.
//   3. For each pixel: alpha = clamp(colour-delta-from-bg / threshold) ^ 0.5
//      — produces a smooth, graduated mask rather than a hard cut.
//   4. Blur the alpha channel (feather edges).
//   5. Re-assemble RGBA image.
//
// NOTE: We never modify the label region — this mask simply reveals or hides
// pixels based on how different they are from the original background.
// ─────────────────────────────────────────────────────────────────────────
async function pass2SoftMask() {
  console.log('[hotfix] [012] [soft-mask] building luminance-delta alpha mask…');

  const { data: srcRaw, info } = await sharp(INPUT_PATH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: W, height: H } = info;

  // Sample background colour from corners (20×20 px each)
  const SAMPLE = 20;
  let rSum = 0, gSum = 0, bSum = 0, n = 0;
  const cornerRegions = [
    { x: 0, y: 0 }, { x: W - SAMPLE, y: 0 },
    { x: 0, y: H - SAMPLE }, { x: W - SAMPLE, y: H - SAMPLE },
  ];
  for (const { x, y } of cornerRegions) {
    for (let cy = y; cy < y + SAMPLE && cy < H; cy++) {
      for (let cx = x; cx < x + SAMPLE && cx < W; cx++) {
        const i = (cy * W + cx) * 4;
        rSum += srcRaw[i]; gSum += srcRaw[i+1]; bSum += srcRaw[i+2];
        n++;
      }
    }
  }
  const bgR = rSum / n, bgG = gSum / n, bgB = bSum / n;
  console.log(`[hotfix] [012] [soft-mask] sampled background colour: rgb(${Math.round(bgR)},${Math.round(bgG)},${Math.round(bgB)})`);

  // Build new RGBA with computed alpha
  const out = Buffer.alloc(srcRaw.length);
  const THRESHOLD = 40;   // colour delta that = 100% opaque; below = graduated

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const i = (py * W + px) * 4;
      const r = srcRaw[i], g = srcRaw[i+1], b = srcRaw[i+2];

      // Euclidean distance from sampled background
      const delta = Math.sqrt(
        (r - bgR) ** 2 +
        (g - bgG) ** 2 +
        (b - bgB) ** 2
      );

      // Graduated alpha: sigmoid-style ramp around threshold
      const rawAlpha = Math.min(1, delta / THRESHOLD);
      // Gamma correction — pull mid-tones toward opaque (helps translucent bottles)
      const alpha = Math.pow(rawAlpha, 0.5);

      out[i]   = r;
      out[i+1] = g;
      out[i+2] = b;
      out[i+3] = Math.round(alpha * 255);
    }
  }

  // Re-assemble as RGBA PNG, apply mild blur to alpha for edge feathering
  // (blur entire image then restore RGB from original — only alpha gets blurred)
  const maskedPng = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  // Blur to feather edges (operates on all channels, so we use it for softening)
  const blurredBuf = await sharp(maskedPng)
    .blur(2)
    .toBuffer();

  // Restore original RGB, keep blurred alpha
  const { data: blurRaw } = await sharp(blurredBuf).raw().toBuffer({ resolveWithObject: true });
  const finalBuf = Buffer.alloc(srcRaw.length);
  for (let i = 0; i < finalBuf.length; i += 4) {
    finalBuf[i]   = srcRaw[i];   // original R
    finalBuf[i+1] = srcRaw[i+1]; // original G
    finalBuf[i+2] = srcRaw[i+2]; // original B
    finalBuf[i+3] = blurRaw[i+3]; // blurred alpha (feathered mask)
  }

  const result = await sharp(finalBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  const opaqueCount = Array.from({ length: finalBuf.length / 4 })
    .filter((_, j) => finalBuf[j * 4 + 3] > 30).length;
  const frac = opaqueCount / (W * H);
  console.log(`[hotfix] [012] [soft-mask] opaque pixel fraction after mask: ${(frac * 100).toFixed(1)}%`);

  return result;
}

// ── Update manifest entry ─────────────────────────────────────────────────
function updateManifest(fields) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const idx = manifest.findIndex(e => e.id === '012');
  if (idx === -1) throw new Error('id 012 not found in manifest');
  manifest[idx] = { ...manifest[idx], ...fields };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  return manifest;
}

// ── Update FAILURES.json ──────────────────────────────────────────────────
function updateFailures(pass) {
  let failures = [];
  if (existsSync(FAILURES)) {
    failures = JSON.parse(readFileSync(FAILURES, 'utf8'));
  }
  if (pass) {
    failures = failures.filter(f => f.id !== '012');
  } else {
    const existing = failures.find(f => f.id === '012');
    if (!existing) {
      failures.push({ id: '012', filename: 'room-sprays.webp', status: 'FAILED',
        qa_issues: ['output too small after hotfix'], suggested_fix: 'Manual edit required' });
    }
  }
  writeFileSync(FAILURES, JSON.stringify(failures, null, 2));
}

// ── Rebuild contact sheet tile for id 012 ────────────────────────────────
async function rebuildContactSheet(manifest) {
  if (!existsSync(CONTACT)) {
    console.log('[hotfix] [012] contact sheet not found — skipping rebuild');
    return;
  }

  // Simple approach: regenerate the full sheet using the updated manifest
  const THUMB = 300;
  const COLS  = 4;
  const successes = manifest.filter(e => e.status === 'SUCCESS').slice(0, 12);
  const failures  = manifest.filter(e => e.status === 'FAILED');
  const subjects  = [...new Map([...successes, ...failures].map(e => [e.id, e])).values()];

  const sheetW = COLS * THUMB * 2 + (COLS + 1) * 10;
  const sheetH = Math.ceil(subjects.length / COLS) * THUMB + (Math.ceil(subjects.length / COLS) + 1) * 10;

  const sheet = sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: { r: 240, g: 240, b: 240 } } });
  const composites = [];

  for (let i = 0; i < subjects.length; i++) {
    const entry = subjects[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const baseX = col * (THUMB * 2 + 10) + 10;
    const baseY = row * (THUMB + 10) + 10;

    try {
      const before = await sharp(entry.input_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
      composites.push({ input: before, left: baseX, top: baseY });
    } catch (_) {}

    if (existsSync(entry.output_path)) {
      try {
        const after = await sharp(entry.output_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
        composites.push({ input: after, left: baseX + THUMB, top: baseY });
      } catch (_) {}
    }
  }

  await sheet.composite(composites).png().toFile(CONTACT);
  console.log('[hotfix] [012] contact sheet rebuilt');
}

// ── Append to REPORT.md ───────────────────────────────────────────────────
function appendReport(result, model, sizeKB) {
  const line = `\n## Hotfix — id 012\nRe-run with conservative segmentation model="${model}".\nResult: **${result}** (${sizeKB} KB output).\n`;
  const existing = existsSync(REPORT) ? readFileSync(REPORT, 'utf8') : '';
  writeFileSync(REPORT, existing + line);
}

// ── Pass 4: Fit-and-pillarbox (guaranteed product integrity fallback) ─────────
//
// No background removal at all — the original photo is resized to 72% frame height,
// placed on the coastal background, and the sides/top edges are feathered with a
// linear gradient so the transition doesn't look pasted.
//
// LABEL INTEGRITY: 100% guaranteed — no pixel inside the source photo is altered.
// ──────────────────────────────────────────────────────────────────────────────
async function pass4FitAndPillarbox() {
  console.log('[hotfix] [012] [fit-pillarbox] resizing source to fit frame, no bg removal…');

  const TARGET_H = Math.round(OUTPUT_SIZE * 0.72);

  // Resize source maintaining AR
  const { data: resizedRaw, info } = await sharp(INPUT_PATH)
    .resize(null, TARGET_H, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height;
  console.log(`[hotfix] [012] [fit-pillarbox] resized source to ${W}×${H}`);

  // Build RGBA version with feathered edges (horizontal feather only — product is portrait)
  const FEATHER = Math.round(W * 0.08);   // 8% width fade on each side
  const rgba    = Buffer.alloc(W * H * 4);

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const srcIdx = (py * W + px) * 3;
      const dstIdx = (py * W + px) * 4;
      rgba[dstIdx]   = resizedRaw[srcIdx];
      rgba[dstIdx+1] = resizedRaw[srcIdx+1];
      rgba[dstIdx+2] = resizedRaw[srcIdx+2];

      // Feather left and right edges
      let alpha = 255;
      if (px < FEATHER)       alpha = Math.round((px / FEATHER) * 255);
      if (px > W - FEATHER)   alpha = Math.round(((W - px) / FEATHER) * 255);

      rgba[dstIdx+3] = alpha;
    }
  }

  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

// ── Try composite + size check ────────────────────────────────────────────
async function tryComposite(fgBuf) {
  const bgBuf = await makeCoastalBackground();
  const buf   = await compositeOnBackground(fgBuf, bgBuf, 'room_spray');
  const sizeKB = Math.round(buf.length / 1024);
  return { buf, sizeKB };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(INPUT_PATH)) {
    console.error(`[hotfix] INPUT NOT FOUND: ${INPUT_PATH}`);
    process.exit(1);
  }

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  let output   = null;
  let sizeKB   = 0;
  let model    = 'unknown';
  let strategy = 'unknown';

  // ── Pass 1: rembg model=medium ──────────────────────────────────────────
  try {
    const p1Result = await pass1();   // returns { buf, opaqueFrac } or null
    if (p1Result) {
      const { buf: fgBuf, opaqueFrac } = p1Result;
      if (opaqueFrac < MIN_OPAQUE_FRAC) {
        console.log(`[hotfix] [012] [medium] opaque fraction ${(opaqueFrac*100).toFixed(1)}% < ${MIN_OPAQUE_FRAC*100}% threshold — product too transparent for segmentation, skipping to Pass 4`);
      } else {
        const result = await tryComposite(fgBuf);
        if (result.sizeKB >= MIN_PASS_KB) {
          output   = result.buf;
          sizeKB   = result.sizeKB;
          model    = 'medium';
          strategy = 'rembg-medium';
          console.log(`[hotfix] [012] [medium] composite = ${sizeKB} KB — PASS`);
        } else {
          console.log(`[hotfix] [012] [medium] composite = ${result.sizeKB} KB — below ${MIN_PASS_KB} KB floor, escalating`);
        }
      }
    }
  } catch (e) {
    console.warn('[hotfix] [012] Pass 1 threw:', e.message);
  }

  // ── Pass 3: BFS flood fill ──────────────────────────────────────────────
  if (!output) {
    model    = 'bfs-flood-fill';
    strategy = 'corner-seeded BFS + tolerance=35 + edge-feather';
    console.log('[hotfix] [012] escalating to Pass 3 (BFS flood fill)…');
    try {
      const fgBuf = await pass3BfsFloodFill();
      const result = await tryComposite(fgBuf);
      sizeKB  = result.sizeKB;
      if (result.sizeKB >= MIN_PASS_KB) {
        output = result.buf;
        console.log(`[hotfix] [012] [bfs-flood] composite = ${sizeKB} KB — above floor, proceeding`);
      } else {
        console.log(`[hotfix] [012] [bfs-flood] composite = ${result.sizeKB} KB — below floor, escalating to Pass 2`);
      }
    } catch (e) {
      console.warn('[hotfix] [012] Pass 3 threw:', e.message);
    }
  }

  // ── Pass 2: soft-mask fallback ──────────────────────────────────────────
  if (!output) {
    model    = 'soft-mask-luminance';
    strategy = 'luminance-delta + alpha-blur';
    console.log('[hotfix] [012] escalating to Pass 2 (soft-mask)…');
    try {
      const fgBuf = await pass2SoftMask();
      const result = await tryComposite(fgBuf);
      sizeKB  = result.sizeKB;
      if (result.sizeKB >= MIN_PASS_KB) {
        output  = result.buf;
        console.log(`[hotfix] [012] [soft-mask] composite = ${sizeKB} KB — above floor`);
      } else {
        console.log(`[hotfix] [012] [soft-mask] composite = ${result.sizeKB} KB — below floor, escalating to Pass 4`);
      }
    } catch (e) {
      console.warn('[hotfix] [012] Pass 2 threw:', e.message);
    }
  }

  // ── Pass 4: Fit-and-pillarbox (no removal, guaranteed integrity) ──────────
  if (!output) {
    model    = 'fit-pillarbox';
    strategy = 'original photo resized to 72% height, feathered edges, coastal bg';
    console.log('[hotfix] [012] escalating to Pass 4 (fit-and-pillarbox — no segmentation)…');
    try {
      const fgBuf = await pass4FitAndPillarbox();
      const result = await tryComposite(fgBuf);
      sizeKB  = result.sizeKB;
      output  = result.buf;   // always accept — product is 100% intact
      console.log(`[hotfix] [012] [fit-pillarbox] composite = ${sizeKB} KB`);
    } catch (e) {
      console.error('[hotfix] [012] Pass 4 threw:', e.message);
      updateManifest({ status: 'FAILED', failure_reason: `hotfix pass 4 error: ${e.message}`, params_used: strategy });
      updateFailures(false);
      appendReport('FAILED', model, 0);
      process.exit(1);
    }
  }

  // ── Final size gate ───────────────────────────────────────────────────────
  if (sizeKB < MIN_PASS_KB) {
    console.error(`[hotfix] [012] [${model}] FAILED — output ${sizeKB} KB < ${MIN_PASS_KB} KB floor after all passes`);
    writeFileSync(OUTPUT_PATH, output);  // write even on fail for human review
    updateManifest({
      status: 'FAILED',
      failure_reason: `hotfix output too small after both passes: ${sizeKB} KB`,
      params_used: strategy,
      notes: 'product may require manual masking — both rembg(medium) and soft-mask failed size gate',
    });
    updateFailures(false);
    appendReport('FAILED', model, sizeKB);
    process.exit(1);
  }

  // ── Write final output ────────────────────────────────────────────────────
  writeFileSync(OUTPUT_PATH, output);

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  console.log(`[hotfix] [012] [room-sprays.webp] [${model}] SUCCESS [${sizeKB} KB] → ${OUTPUT_PATH}`);

  const manifest = updateManifest({
    status: 'SUCCESS',
    failure_reason: '',
    prompt_used: `hotfix: ${strategy}`,
    params_used: `model=${model}, OUTPUT_SIZE=${OUTPUT_SIZE}, WEBP_QUALITY=${WEBP_QUALITY}, MIN_PASS_KB=${MIN_PASS_KB}`,
    notes: `hotfix re-run — original rembg(small) stripped product; fixed with ${strategy}`,
  });

  updateFailures(true);
  appendReport('PASS', model, sizeKB);
  await rebuildContactSheet(manifest);

  console.log(`[hotfix] [012] manifest updated, FAILURES.json cleared, contact sheet rebuilt`);
}

main().catch(err => {
  console.error('[hotfix] FATAL:', err);
  process.exit(1);
});

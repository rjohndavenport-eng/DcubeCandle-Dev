/**
 * CODEX-QA v2
 * Validates _styled_v2 outputs:
 *   - 2000×2000 WebP sRGB
 *   - File size sanity (>200 KB for candle/diffuser; >80 KB for room_spray)
 *   - Centre region not blank
 *   - Writes qc_contact_sheet.png, FAILURES.json, REPORT.md
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

const OUTPUT_DIR    = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v2';
const MANIFEST_PATH = `${OUTPUT_DIR}/manifest.json`;
const CONTACT_PATH  = `${OUTPUT_DIR}/qc_contact_sheet.png`;
const FAILURES_PATH = `${OUTPUT_DIR}/FAILURES.json`;
const REPORT_PATH   = `${OUTPUT_DIR}/REPORT.md`;

const EXPECTED_SIZE = 2000;
const MAX_BYTES     = 8_000_000;

function minBytes(category) {
  return category === 'room_spray' ? 80_000 : 200_000;
}

// ── Per-image check ────────────────────────────────────────────────────────────

async function checkOutput(entry) {
  if (entry.status !== 'SUCCESS') {
    return { ...entry, qa_pass: false, qa_issues: [`status=${entry.status}`] };
  }
  if (!existsSync(entry.output_path)) {
    return { ...entry, qa_pass: false, qa_issues: ['output file missing'] };
  }

  const issues = [];
  const bytes  = statSync(entry.output_path).size;
  const minB   = minBytes(entry.category);

  if (bytes < minB) issues.push(`file too small (${bytes} B, min ${minB} B)`);
  if (bytes > MAX_BYTES) issues.push(`file too large (${bytes} B)`);

  let meta;
  try {
    meta = await sharp(entry.output_path).metadata();
  } catch (e) {
    return { ...entry, qa_pass: false, qa_issues: [`cannot read: ${e.message}`] };
  }

  if (meta.format !== 'webp')          issues.push(`wrong format: ${meta.format}`);
  if (meta.width  !== EXPECTED_SIZE)   issues.push(`wrong width: ${meta.width}`);
  if (meta.height !== EXPECTED_SIZE)   issues.push(`wrong height: ${meta.height}`);
  if (meta.space  !== 'srgb')          issues.push(`wrong colorspace: ${meta.space}`);

  // Centre region blank heuristic
  try {
    const centre = await sharp(entry.output_path)
      .extract({ left: 700, top: 700, width: 600, height: 600 })
      .greyscale().raw().toBuffer();
    const mean = centre.reduce((s, v) => s + v, 0) / centre.length;
    if (mean > 252) issues.push('possible blank/white output (centre near pure white)');
    if (mean < 3)   issues.push('possible blank/black output (centre near pure black)');
  } catch (_) { /* non-fatal */ }

  const pass = issues.length === 0;
  const kb   = Math.round(bytes / 1024);
  const tag  = `[${entry.id}] [${basename(entry.output_path)}]`;

  if (pass) {
    console.log(`[QA-V2] ${tag} PASS [${kb} KB]`);
  } else {
    console.warn(`[QA-V2] ${tag} FAIL — ${issues.join('; ')}`);
  }

  return { ...entry, qa_pass: pass, qa_issues: issues };
}

function basename(p) { return p.split('/').pop(); }

// ── Contact sheet ─────────────────────────────────────────────────────────────

async function buildContactSheet(results) {
  // Separate day and night; show first 8 of each + all failures, side by side
  const days   = results.filter(e => e.style_mode === 'DAY'  && e.status === 'SUCCESS').slice(0, 8);
  const nights = results.filter(e => e.style_mode === 'NIGHT' && e.status === 'SUCCESS').slice(0, 8);
  const failed = results.filter(e => e.qa_pass === false);

  // Build pairs: [dayEntry, nightEntry] for same product
  const productSlugs = [...new Set(days.map(e => e.id.replace(/-day$/, '')))];
  const pairs = productSlugs.map(slug => ({
    day:   days.find(e => e.id === `${slug}-day`),
    night: nights.find(e => e.id === `${slug}-night`),
  })).filter(p => p.day || p.night);

  // Also add failure rows (before vs output)
  const failRows = failed.slice(0, 8).map(e => ({ fail: e }));

  const THUMB = 250;
  const ROWS  = pairs.length + failRows.length;
  const COLS  = 3; // input | day | night
  const GAP   = 6;
  const sheetW = COLS * THUMB + (COLS + 1) * GAP;
  const sheetH = ROWS * THUMB + (ROWS + 1) * GAP;

  const composites = [];

  for (let r = 0; r < pairs.length; r++) {
    const { day, night } = pairs[r];
    const baseY = r * (THUMB + GAP) + GAP;
    const entry = day ?? night;

    // Col 0: original input
    try {
      const inBuf = await sharp(entry.input_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
      composites.push({ input: inBuf, left: GAP, top: baseY });
    } catch (_) {}

    // Col 1: day output
    if (day && existsSync(day.output_path)) {
      try {
        const buf = await sharp(day.output_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
        composites.push({ input: buf, left: GAP + THUMB + GAP, top: baseY });
      } catch (_) {}
    }

    // Col 2: night output
    if (night && existsSync(night.output_path)) {
      try {
        const buf = await sharp(night.output_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
        composites.push({ input: buf, left: GAP + (THUMB + GAP) * 2, top: baseY });
      } catch (_) {}
    }
  }

  // Failure rows (input | output | blank)
  for (let r = 0; r < failRows.length; r++) {
    const { fail } = failRows[r];
    const baseY = (pairs.length + r) * (THUMB + GAP) + GAP;

    try {
      const inBuf = await sharp(fail.input_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
      composites.push({ input: inBuf, left: GAP, top: baseY });
    } catch (_) {}

    if (existsSync(fail.output_path)) {
      try {
        const buf = await sharp(fail.output_path).resize(THUMB, THUMB, { fit: 'cover' }).toBuffer();
        composites.push({ input: buf, left: GAP + THUMB + GAP, top: baseY });
      } catch (_) {}
    }
  }

  await sharp({ create: { width: sheetW, height: sheetH, channels: 3,
    background: { r: 224, g: 224, b: 224 } } })
    .composite(composites)
    .png()
    .toFile(CONTACT_PATH);

  console.log(`[QA-V2] Contact sheet written → ${CONTACT_PATH}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('[QA-V2] manifest.json not found — run editor-v2.mjs first'); process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const done     = manifest.filter(e => e.status === 'SUCCESS' || e.status === 'FAILED');
  console.log(`[QA-V2] Checking ${done.length} processed entries…\n`);

  const results = [];
  for (const entry of manifest) {
    if (entry.status === 'SUCCESS' || entry.status === 'FAILED') {
      results.push(await checkOutput(entry));
    } else {
      results.push({ ...entry, qa_pass: null, qa_issues: [] });
    }
  }

  const passes   = results.filter(e => e.qa_pass === true);
  const blockers = results.filter(e => e.qa_pass === false);
  const dayPass  = passes.filter(e => e.style_mode === 'DAY').length;
  const nightPass = passes.filter(e => e.style_mode === 'NIGHT').length;

  console.log(`\n[QA-V2] ${passes.length} PASS (${dayPass} day / ${nightPass} night) | ${blockers.length} BLOCKERS`);

  // FAILURES.json
  if (blockers.length > 0) {
    const report = blockers.map(e => ({
      id:            e.id,
      filename:      basename(e.output_path),
      style_mode:    e.style_mode,
      category:      e.category,
      status:        e.status,
      qa_issues:     e.qa_issues,
      suggested_fix: e.qa_issues.some(i => i.includes('blank'))
        ? 'Re-run — possible rembg strip or blank generation'
        : e.qa_issues.some(i => i.includes('small'))
        ? 'Re-run — output too small, check glass fallback'
        : 'Re-run CODEX-EDITOR-V2 for this entry',
    }));
    writeFileSync(FAILURES_PATH, JSON.stringify(report, null, 2));
    console.log(`[QA-V2] FAILURES.json → ${FAILURES_PATH}`);
    blockers.forEach(e =>
      console.warn(`  BLOCKER [${e.id}] ${basename(e.output_path)}: ${e.qa_issues.join('; ')}`)
    );
  }

  // Contact sheet
  await buildContactSheet(results);

  // REPORT.md
  const now     = new Date().toISOString().slice(0, 10);
  const success = results.filter(e => e.status === 'SUCCESS');
  const failed  = results.filter(e => e.status === 'FAILED');
  const pending = results.filter(e => e.status === 'PENDING');

  const totalBytes = success.reduce((s, e) => {
    try { return s + statSync(e.output_path).size; } catch { return s; }
  }, 0);
  const avgKB = success.length ? Math.round(totalBytes / success.length / 1024) : 0;

  const report = `# DCube Image Pipeline v2 — REPORT
Generated: ${now}

## Summary

| Metric | Value |
|---|---|
| Total entries | ${results.length} |
| SUCCESS | ${success.length} |
| FAILED | ${failed.length} |
| PENDING (skipped) | ${pending.length} |
| QA PASS | ${passes.length} |
| QA BLOCKERS | ${blockers.length} |
| Day PASS | ${dayPass} |
| Night PASS | ${nightPass} |
| Avg output size | ~${avgKB} KB/file |
| Output format | WebP sRGB 2000×2000 |
| WebP quality | ${92} |

## Improvements over v1

- Post-composite label lock on ALL images (day + night)
- Lid strip for NIGHT candles: top 18% of product bbox → AI-generated flame zone
- "Lid placed beside candle on sand" in NIGHT candle prompt
- Stronger DAY + NIGHT prompts with scene-specific details
- 2000×2000 output (v1 was 2048×2048)

## Day Outputs

${success.filter(e => e.style_mode === 'DAY').map(e =>
  `- \`${basename(e.output_path)}\` (${e.category})`).join('\n')}

## Night Outputs

${success.filter(e => e.style_mode === 'NIGHT').map(e =>
  `- \`${basename(e.output_path)}\` (${e.category})`).join('\n')}

## Failures (${failed.length})

${failed.length === 0 ? '_None._' : failed.map(e =>
  `- \`${basename(e.input_path)}\` [${e.style_mode}] — ${e.failure_reason}`).join('\n')}

## Next Steps

${blockers.length > 0
  ? `1. Review FAILURES.json.\n2. Reset failed entries to PENDING.\n3. Re-run \`node scripts/editor-v2.mjs\`.`
  : `All ${results.length} images processed. Upload _styled_v2/ to Shopify CDN.`}
`;

  writeFileSync(REPORT_PATH, report);
  console.log(`[QA-V2] REPORT.md → ${REPORT_PATH}`);
  console.log('[QA-V2] COMPLETE');
}

main().catch(err => { console.error('[QA-V2] FATAL:', err); process.exit(1); });

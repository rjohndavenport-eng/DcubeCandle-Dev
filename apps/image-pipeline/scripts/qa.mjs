/**
 * CODEX-QA
 * Validates outputs from CODEX-EDITOR:
 *   - Correct dimensions (2000×2000)
 *   - WebP format
 *   - File size sanity (> 50 KB = not blank; < 8 MB = not ballooned)
 *   - Produces a qc_contact_sheet.png (before/after grid, first 12 + all failures)
 *   - Writes FAILURES.json with blockers + suggested fixes
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const MANIFEST_PATH = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const OUTPUT_DIR    = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled';
const CONTACT_PATH  = `${OUTPUT_DIR}/qc_contact_sheet.png`;
const FAILURES_PATH = `${OUTPUT_DIR}/FAILURES.json`;

const EXPECTED_SIZE = 2048;
const MIN_BYTES     = 40_000;     //  40 KB (room spray bottles compress smaller than candle jars)
const MAX_BYTES     = 8_000_000;  //   8 MB

// ── Per-image QA check ────────────────────────────────────────────────────────

async function checkOutput(entry) {
  const issues = [];

  if (entry.status !== 'SUCCESS') {
    return { ...entry, qa_pass: false, qa_issues: [`status=${entry.status}`] };
  }

  if (!existsSync(entry.output_path)) {
    return { ...entry, qa_pass: false, qa_issues: ['output file missing'] };
  }

  const stat = (await import('fs')).statSync(entry.output_path);
  const bytes = stat.size;

  if (bytes < MIN_BYTES) issues.push(`file too small (${bytes} bytes — likely blank)`);
  if (bytes > MAX_BYTES) issues.push(`file too large (${bytes} bytes — check compression)`);

  let meta;
  try {
    meta = await sharp(entry.output_path).metadata();
  } catch (e) {
    return { ...entry, qa_pass: false, qa_issues: [`cannot read file: ${e.message}`] };
  }

  if (meta.format !== 'webp')           issues.push(`wrong format: ${meta.format} (expected webp)`);
  if (meta.width  !== EXPECTED_SIZE)    issues.push(`wrong width: ${meta.width} (expected ${EXPECTED_SIZE})`);
  if (meta.height !== EXPECTED_SIZE)    issues.push(`wrong height: ${meta.height} (expected ${EXPECTED_SIZE})`);
  if (meta.space  !== 'srgb')           issues.push(`wrong colorspace: ${meta.space} (expected srgb)`);

  // Blank image heuristic: sample centre crop stats
  try {
    const centre = await sharp(entry.output_path)
      .extract({ left: 800, top: 800, width: 400, height: 400 })
      .greyscale()
      .raw()
      .toBuffer();

    const mean = centre.reduce((s, v) => s + v, 0) / centre.length;
    if (mean > 252) issues.push('possible blank/white output (centre region near pure white)');
    if (mean < 3)   issues.push('possible blank/black output (centre region near pure black)');
  } catch (_) { /* non-fatal */ }

  const pass = issues.length === 0;
  if (pass) {
    console.log(`[CODEX-QA] [${entry.id}] [${entry.output_path.split('/').pop()}] PASS`);
  } else {
    console.warn(`[CODEX-QA] [${entry.id}] [${entry.output_path.split('/').pop()}] FAIL — ${issues.join('; ')}`);
  }

  return { ...entry, qa_pass: pass, qa_issues: issues };
}

// ── Contact sheet ─────────────────────────────────────────────────────────────

async function buildContactSheet(entries) {
  // Show first 12 SUCCESS entries + all failures (before/after pairs)
  const successes = entries.filter(e => e.status === 'SUCCESS').slice(0, 12);
  const failures  = entries.filter(e => e.status === 'FAILED' || (e.qa_issues && e.qa_issues.length > 0));
  const subjects  = [...new Map([...successes, ...failures].map(e => [e.id, e])).values()];

  if (subjects.length === 0) {
    console.log('[CODEX-QA] No outputs to include in contact sheet.');
    return;
  }

  const THUMB = 300;   // px per thumbnail
  const COLS  = 4;
  const ROWS  = Math.ceil(subjects.length / COLS);

  const sheetW = COLS * THUMB * 2 + (COLS + 1) * 10;   // before + after side-by-side
  const sheetH = ROWS * THUMB + (ROWS + 1) * 10;

  // Create white sheet
  const sheet = sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 3,
      background: { r: 240, g: 240, b: 240 },
    }
  });

  const composites = [];

  for (let i = 0; i < subjects.length; i++) {
    const entry = subjects[i];
    const col   = i % COLS;
    const row   = Math.floor(i / COLS);

    const baseX = col * (THUMB * 2 + 10) + 10;
    const baseY = row * (THUMB + 10) + 10;

    // Before thumbnail
    try {
      const beforeBuf = await sharp(entry.input_path)
        .resize(THUMB, THUMB, { fit: 'cover' })
        .toBuffer();
      composites.push({ input: beforeBuf, left: baseX, top: baseY });
    } catch (_) { /* skip if source missing */ }

    // After thumbnail
    if (existsSync(entry.output_path)) {
      try {
        const afterBuf = await sharp(entry.output_path)
          .resize(THUMB, THUMB, { fit: 'cover' })
          .toBuffer();
        composites.push({ input: afterBuf, left: baseX + THUMB, top: baseY });
      } catch (_) { /* skip */ }
    }
  }

  await sheet
    .composite(composites)
    .png()
    .toFile(CONTACT_PATH);

  console.log(`[CODEX-QA] Contact sheet written → ${CONTACT_PATH}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const done     = manifest.filter(e => e.status === 'SUCCESS' || e.status === 'FAILED');

  console.log(`[CODEX-QA] Checking ${done.length} processed entries…`);

  const results  = [];
  for (const entry of manifest) {
    if (entry.status === 'SUCCESS' || entry.status === 'FAILED') {
      results.push(await checkOutput(entry));
    } else {
      results.push({ ...entry, qa_pass: null, qa_issues: [] });
    }
  }

  const blockers = results.filter(e => e.qa_pass === false);
  const passes   = results.filter(e => e.qa_pass === true);

  console.log(`\n[CODEX-QA] ${passes.length} PASS | ${blockers.length} BLOCKERS`);

  // Write FAILURES.json
  if (blockers.length > 0) {
    const failureReport = blockers.map(e => ({
      id:             e.id,
      filename:       e.output_path.split('/').pop(),
      status:         e.status,
      qa_issues:      e.qa_issues,
      suggested_fix:  e.qa_issues.some(i => i.includes('blank'))
        ? 'Re-run with tighter mask / check source image is not white-background'
        : e.qa_issues.some(i => i.includes('size'))
        ? 'Adjust WEBP_QUALITY or check source image readability'
        : 'Re-run CODEX-EDITOR for this entry',
    }));

    writeFileSync(FAILURES_PATH, JSON.stringify(failureReport, null, 2));
    console.log(`[CODEX-QA] FAILURES.json written → ${FAILURES_PATH}`);
    blockers.forEach(e => {
      console.warn(`  BLOCKER [${e.id}] ${e.output_path.split('/').pop()}: ${e.qa_issues.join('; ')}`);
    });
  }

  // Build contact sheet
  await buildContactSheet(results);

  console.log('\n[CODEX-QA] COMPLETE');
}

main().catch(err => {
  console.error('[CODEX-QA] FATAL:', err);
  process.exit(1);
});

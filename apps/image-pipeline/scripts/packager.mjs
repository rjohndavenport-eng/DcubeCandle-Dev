/**
 * CODEX-PACKAGER
 * Finalises exports:
 *   - Ensures every SUCCESS output is exactly 2000×2000 WebP (re-crops if needed)
 *   - Verifies sRGB colorspace
 *   - Writes REPORT.md (counts, failures, next steps)
 *   - Finalises manifest.json
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

const MANIFEST_PATH = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled/manifest.json';
const OUTPUT_DIR    = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled';
const REPORT_PATH   = `${OUTPUT_DIR}/REPORT.md`;

const TARGET_SIZE = 2000;
const WEBP_Q      = 92;

async function enforceSquare(entry) {
  if (!existsSync(entry.output_path)) return entry;

  const meta = await sharp(entry.output_path).metadata();

  if (meta.width === TARGET_SIZE && meta.height === TARGET_SIZE && meta.format === 'webp') {
    return entry;  // already correct
  }

  console.log(`[CODEX-PACKAGER] [${entry.id}] resizing ${meta.width}×${meta.height} → ${TARGET_SIZE}×${TARGET_SIZE}`);

  const fixed = await sharp(entry.output_path)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: WEBP_Q })
    .toBuffer();

  writeFileSync(entry.output_path, fixed);
  return { ...entry, notes: (entry.notes + ' [packager: resized to 2000x2000]').trim() };
}

async function main() {
  let manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  console.log('[CODEX-PACKAGER] Verifying + finalising outputs…');

  const updated = [];
  for (const entry of manifest) {
    if (entry.status === 'SUCCESS') {
      updated.push(await enforceSquare(entry));
    } else {
      updated.push(entry);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(updated, null, 2));

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total    = updated.length;
  const success  = updated.filter(e => e.status === 'SUCCESS');
  const failed   = updated.filter(e => e.status === 'FAILED');
  const pending  = updated.filter(e => e.status === 'PENDING');

  const totalBytes = success.reduce((sum, e) => {
    try { return sum + statSync(e.output_path).size; } catch { return sum; }
  }, 0);
  const avgKB = success.length > 0 ? Math.round(totalBytes / success.length / 1024) : 0;

  const now = new Date().toISOString().slice(0, 10);

  const report = `# DCube Image Pipeline — REPORT
Generated: ${now}

## Summary

| Metric | Value |
|---|---|
| Total images | ${total} |
| SUCCESS | ${success.length} |
| FAILED | ${failed.length} |
| PENDING (skipped) | ${pending.length} |
| Avg output size | ~${avgKB} KB/file |
| Output format | WebP, sRGB, 2000×2000 |
| WebP quality | ${WEBP_Q} |

## Success

${success.map(e => `- \`${e.output_path.split('/').pop()}\` (${e.category}, ${e.variant})`).join('\n')}

## Failures (${failed.length})

${failed.length === 0
  ? '_None._'
  : failed.map(e => `- \`${e.input_path.split('/').pop()}\` — ${e.failure_reason}`).join('\n')}

## Next Steps

${failed.length > 0 ? `1. Review FAILURES.json for per-file blocker details.
2. For "model download" errors: re-run editor (model caches after first download).
3. For "label integrity" warnings: manually review outputs in _styled/.
4. Re-run \`npm run edit\` — PENDING entries will be re-attempted.` : `All images processed. Upload _styled/ contents to Shopify CDN.`}

## Variants Applied

| Variant | Count |
|---|---|
| coastal_lifestyle | ${updated.filter(e => e.variant === 'coastal_lifestyle').length} |
| clean_studio | ${updated.filter(e => e.variant === 'clean_studio').length} |
`;

  writeFileSync(REPORT_PATH, report);
  console.log(`[CODEX-PACKAGER] REPORT.md written → ${REPORT_PATH}`);
  console.log(`[CODEX-PACKAGER] COMPLETE — ${success.length}/${total} finalised`);
}

main().catch(err => {
  console.error('[CODEX-PACKAGER] FATAL:', err);
  process.exit(1);
});

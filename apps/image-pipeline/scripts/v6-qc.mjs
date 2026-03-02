import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v6/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);
const QC_OUTPUT = path.join(OUTPUT_DIR, 'qc_contact_sheet.png');

const THUMB_SIZE = 500;

async function main() {
  console.log('Reading manifest (v6)...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const processedProducts = manifest.products.filter(p => p.day_final && p.night_final);

  if (processedProducts.length === 0) {
    console.log('No processed products to QC.');
    return;
  }

  console.log(`Generating QC sheet (v6) for ${processedProducts.length} products...`);

  const strips = [];

  for (const product of processedProducts) {
    console.log(`  - Processing ${product.name}`);
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const dayPath = path.join(OUTPUT_DIR, product.day_final);
    const nightPath = path.join(OUTPUT_DIR, product.night_final);
    
    const original = await sharp(originalPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    const day = await sharp(dayPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    const night = await sharp(nightPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    
    const strip = await sharp({
      create: {
        width: THUMB_SIZE * 3,
        height: THUMB_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: original, left: 0, top: 0 },
      { input: day, left: THUMB_SIZE, top: 0 },
      { input: night, left: THUMB_SIZE * 2, top: 0 }
    ])
    .png()
    .toBuffer();

    strips.push(strip);
  }

  const totalHeight = strips.length * THUMB_SIZE;
  const totalWidth = THUMB_SIZE * 3;

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(strips.map((buf, index) => ({ input: buf, left: 0, top: index * THUMB_SIZE })))
  .toFile(QC_OUTPUT);

  console.log(`QC Sheet saved to: ${QC_OUTPUT}`);
}

main().catch(console.error);

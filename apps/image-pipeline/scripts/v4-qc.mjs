import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v4/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);
const QC_OUTPUT = path.join(OUTPUT_DIR, 'qc_contact_sheet.png');

const THUMB_SIZE = 500;

async function main() {
  console.log('Reading manifest...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const processedProducts = manifest.products.filter(p => p.day_scene && p.night_scene);

  if (processedProducts.length === 0) {
    console.log('No processed products to QC.');
    return;
  }

  console.log(`Generating QC sheet for ${processedProducts.length} products...`);

  const strips = [];

  for (const product of processedProducts) {
    console.log(`  - Processing ${product.name}`);
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const dayPath = path.join(OUTPUT_DIR, path.basename(product.day_scene)); // manifest path is relative to output dir
    const nightPath = path.join(OUTPUT_DIR, path.basename(product.night_scene));
    
    // Resize all to THUMB_SIZE x THUMB_SIZE
    const original = await sharp(originalPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    const day = await sharp(dayPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    const night = await sharp(nightPath).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).toBuffer();
    
    // Create strip: [Original] [Day] [Night]
    // Width = 3 * THUMB_SIZE, Height = THUMB_SIZE
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

  // Combine strips vertically
  const totalHeight = strips.length * THUMB_SIZE;
  const totalWidth = THUMB_SIZE * 3;

  console.log(`  - Compositing final sheet (${totalWidth}x${totalHeight})...`);
  
  const composites = strips.map((buf, index) => ({
    input: buf,
    left: 0,
    top: index * THUMB_SIZE
  }));

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(composites)
  .toFile(QC_OUTPUT);

  console.log(`QC Sheet saved to: ${QC_OUTPUT}`);
}

main().catch(console.error);

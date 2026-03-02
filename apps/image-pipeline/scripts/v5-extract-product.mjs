import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v5/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

async function main() {
  console.log('Reading manifest (v5)...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const pendingProducts = manifest.products.filter(p => !p.product_asset).slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products for asset extraction.');
    return;
  }

  console.log(`Extracting immutable product assets for ${pendingProducts.length} products...`);

  for (const product of pendingProducts) {
    console.log(`[BOT-01] Freezing: ${product.name}`);
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const assetOutputPath = path.join(OUTPUT_DIR, '_product_assets', `${product.id}-product.png`);

    try {
      if (!fs.existsSync(originalPath)) throw new Error(`File not found: ${originalPath}`);

      // Extract full candle (jar + lid + wax + label)
      const fileBuffer = fs.readFileSync(originalPath);
      const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
      
      const blob = await removeBackground(fileBlob, { model: 'medium' });
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Save high-res asset
      await sharp(buffer)
        .toFile(assetOutputPath);

      console.log(`  - SUCCESS: Saved to ${assetOutputPath}`);
      product.product_asset = path.relative(OUTPUT_DIR, assetOutputPath);

    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v4/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

async function main() {
  console.log('Reading manifest...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const pendingProducts = manifest.products.filter(p => p.status === 'PENDING').slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products to process.');
    return;
  }

  console.log(`Processing ${pendingProducts.length} products...`);

  for (const product of pendingProducts) {
    console.log(`Extracting label for: ${product.name} (${product.id})`);
    
    // Construct paths
    // The original path in manifest is relative like "products/fresh-start/0__public.jpg"
    // We need the absolute path.
    // The base dir for "products/..." seems to be "D:\onedrive\Desktop\becandle\dcube-sandbox-catalog\image-export"
    
    const originalPath = path.join('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export', product.original_path);
    const labelOutputPath = path.join(OUTPUT_DIR, '_labels', `${product.id}-label.png`);

    try {
      if (!fs.existsSync(originalPath)) {
        throw new Error(`Original file not found: ${originalPath}`);
      }

      // 1. Remove background to isolate the jar
      console.log(`  - Removing background...`);
      // Read file into a Blob to avoid protocol issues with local paths
      const fileBuffer = fs.readFileSync(originalPath);
      const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
      
      const blob = await removeBackground(fileBlob);
      const buffer = Buffer.from(await blob.arrayBuffer());

      // 2. Crop to label area (Heuristic: Center 60% width, Center 50% height)
      // This assumes the label is roughly in the center of the jar.
      // We will refine this if needed.
      console.log(`  - Cropping label region...`);
      
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      const width = metadata.width;
      const height = metadata.height;

      const extractWidth = Math.floor(width * 0.6);
      const extractHeight = Math.floor(height * 0.5);
      const left = Math.floor((width - extractWidth) / 2);
      const top = Math.floor((height - extractHeight) / 2) + Math.floor(height * 0.1); // Shift down slightly

      await image
        .extract({ left, top, width: extractWidth, height: extractHeight })
        .toFile(labelOutputPath);

      console.log(`  - Label saved to: ${labelOutputPath}`);
      
      product.labels_extracted = true;

    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
      // Mark as failed? No, let's keep it pending but maybe log failure?
      // For now, just log to console.
    }
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log('Manifest updated.');
}

main().catch(console.error);

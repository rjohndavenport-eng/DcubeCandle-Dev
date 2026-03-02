import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const MANIFEST_PATH = path.resolve('D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export/products/_styled_v5/manifest.json');
const OUTPUT_DIR = path.dirname(MANIFEST_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS = {
  day: `
Background only. Do not include any candle, jar, glass, or product.
Premium luxury coastal tropical beach scene.
Clear cerulean sky, soft white clouds on the horizon. Shallow depth-of-field bokeh on turquoise ocean in the distance.
Fine sun-bleached sand foreground with gentle ripple texture. Warm sunlight.
The scene must be empty, ready for a product to be placed. 
Photorealistic premium lifestyle background. Cinematic soft lighting. 1024x1024.
`.trim(),

  night: `
Background only. Do not include any candle, jar, glass, or product.
Moonlit ocean scene at night.
Deep navy and midnight blue night sky, near-full moon above casting cool silver light on calm ocean in the distance.
Dark warm sand foreground. Subtle moon reflection on water.
Realistic darkness. Not over-blue. Natural shadows.
The scene must be empty, ready for a product to be placed.
Photorealistic cinematic nighttime background. Ultra high quality. 1024x1024.
`.trim(),
};

async function main() {
  console.log('Reading manifest (v5)...');
  const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestData);

  const pendingProducts = manifest.products.filter(p => p.status === 'PENDING' && (!p.day_bg || !p.night_bg)).slice(0, 2);

  if (pendingProducts.length === 0) {
    console.log('No pending products for background generation.');
    return;
  }

  for (const product of pendingProducts) {
    console.log(`[BOT-02] Generating environments for: ${product.name}`);

    try {
      if (!product.day_bg) {
        console.log(`  - Generating DAY background...`);
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: PROMPTS.day,
          size: "1024x1024",
          n: 1,
          response_format: 'b64_json'
        });
        const buffer = Buffer.from(response.data[0].b64_json, 'base64');
        const dayBgPath = path.join(OUTPUT_DIR, '_env', `${product.id}-day-bg.png`);
        fs.writeFileSync(dayBgPath, buffer);
        product.day_bg = path.relative(OUTPUT_DIR, dayBgPath);
        console.log(`    -> Saved to ${dayBgPath}`);
      }

      if (!product.night_bg) {
        console.log(`  - Generating NIGHT background...`);
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: PROMPTS.night,
          size: "1024x1024",
          n: 1,
          response_format: 'b64_json'
        });
        const buffer = Buffer.from(response.data[0].b64_json, 'base64');
        const nightBgPath = path.join(OUTPUT_DIR, '_env', `${product.id}-night-bg.png`);
        fs.writeFileSync(nightBgPath, buffer);
        product.night_bg = path.relative(OUTPUT_DIR, nightBgPath);
        console.log(`    -> Saved to ${nightBgPath}`);
      }

    } catch (error) {
      console.error(`  - FAILED: ${error.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import pLimit from 'p-limit';

const OUTPUT_ROOT = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export';
const MANIFESTS_DIR = path.join(OUTPUT_ROOT, 'manifests');

const CONCURRENCY_LIMIT = 5;
const limit = pLimit(CONCURRENCY_LIMIT);

const manifestStream = fs.createWriteStream(path.join(MANIFESTS_DIR, 'images_manifest_public.jsonl'), { flags: 'a' });

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function downloadFile(url, dest, source, meta = {}, retries = 4) {
  const absoluteDest = path.join(OUTPUT_ROOT, dest);
  ensureDir(path.dirname(absoluteDest));

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const buffer = await response.buffer();
    const sha256 = computeSha256(buffer);
    
    fs.writeFileSync(absoluteDest, buffer);

    const manifestEntry = {
      source,
      ...meta,
      original_url: url,
      local_path: dest,
      content_type: response.headers.get('content-type'),
      bytes: buffer.length,
      sha256,
      downloaded_at: new Date().toISOString(),
    };

    manifestStream.write(JSON.stringify(manifestEntry) + '\n');
    console.log(`[SUCCESS] Downloaded: ${dest}`);
    return manifestEntry;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return downloadFile(url, dest, source, meta, retries - 1);
    } else {
      console.error(`[ERROR] Failed ${url}: ${err.message}`);
      return null;
    }
  }
}

const publicImages = [
  { title: "Sunset in Sorrento", handle: "sunset-in-sorrento", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image1.jpg?v=1720987248" },
  { title: "Fresh Start", handle: "fresh-start", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image5.jpg?v=1720987076" },
  { title: "Forgotten Pages", handle: "forgotten-pages", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image7.jpg?v=1720987010" },
  { title: "Mermaids Laundry", handle: "mermaids-laundry", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image3.jpg?v=1720987174" },
  { title: "Desert Serenade", handle: "desert-serenade", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image0.jpg?v=1720986819" },
  { title: "Sweet Confections", handle: "sweet-confections", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image2.jpg?v=1720987321" },
  { title: "Enchanted Evening", handle: "enchanted-evening", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image8.jpg?v=1720986923" },
  { title: "Angels Bouquet", handle: "angels-bouquet", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image3_ebc2f723-fad5-4655-83ce-600c7457b1aa.jpg?v=1721769694" },
  { title: "Sarasota Sunshine", handle: "sarasota-sunshine", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image4_d0bbdec4-feb3-47da-9c35-00a7d2d79efc.jpg?v=1721769823" },
  { title: "Her Light", handle: "her-light", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/image5_03a05645-de63-4f7f-9421-5b1cdc4854f8.jpg?v=1721769770" },
  { title: "Room Diffusers", handle: "diffusers", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1553.jpg?v=1724634929" },
  { title: "Room Sprays", handle: "room-sprays", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1576.jpg?v=1725324309" },
  { title: "Date Night", handle: "date-night", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1067.heic?v=1768490475" },
  { title: "Sweet Serenity", handle: "sweet-serenity", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1076_e334043e-5ddd-43bd-aa61-133cd367aaed.heic?v=1768490200" },
  { title: "Pumpkin Spice", handle: "pumpkin-spice", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1632_9b33c057-a913-4f56-b3c8-cae54883b3b2.heic?v=1758852966" },
  { title: "Apple Maple Crisp", handle: "apple-maple-crisp", url: "https://cdn.shopify.com/s/files/1/0706/6412/6684/files/IMG_1627_1_67edfcf1-5c5f-494b-b6da-b3f3578ce601.heic?v=1727805904" }
];

async function main() {
  ensureDir(OUTPUT_ROOT);
  ensureDir(MANIFESTS_DIR);

  const tasks = publicImages.map((img, idx) => {
    const parsedUrl = new URL(img.url);
    let ext = path.extname(parsedUrl.pathname) || '.jpg';
    if (ext === '.heic') ext = '.jpg'; // Normalizing HEIC for better compatibility if needed, but keeping as is for now
    
    const dest = `products/${img.handle}/0__public${ext}`;
    return limit(() => downloadFile(img.url, dest, 'products_public', { owner_handle: img.handle, title: img.title }));
  });

  console.log(`Starting download of ${tasks.length} public images...`);
  await Promise.all(tasks);
  console.log('Public image download complete.');
  manifestStream.end();
}

main().catch(console.error);

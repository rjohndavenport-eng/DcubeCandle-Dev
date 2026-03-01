import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import 'dotenv/config';
import { shopifyGraphql } from './lib/shopify-graphql.mjs';

const {
  SHOPIFY_STORE_DOMAIN,
  SHOPIFY_ADMIN_ACCESS_TOKEN,
  SHOPIFY_API_VERSION = '2025-01'
} = process.env;

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in environment.');
  process.exit(1);
}

const OUTPUT_ROOT = 'D:/onedrive/Desktop/becandle/dcube-sandbox-catalog/image-export';
const MANIFESTS_DIR = path.join(OUTPUT_ROOT, 'manifests');
const DEDUPE_DIR = path.join(OUTPUT_ROOT, '_dedupe');

const CONCURRENCY_LIMIT = 5;
const limit = pLimit(CONCURRENCY_LIMIT);

const manifestStream = fs.createWriteStream(path.join(MANIFESTS_DIR, 'images_manifest.jsonl'), { flags: 'a' });
const downloadLogStream = fs.createWriteStream(path.join(MANIFESTS_DIR, 'download_log.ndjson'), { flags: 'a' });
const failuresStream = fs.createWriteStream(path.join(MANIFESTS_DIR, 'failures.ndjson'), { flags: 'a' });

const HASHES_FILE = path.join(DEDUPE_DIR, 'hashes.jsonl');

/**
 * Creates directory if it doesn't exist.
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Computes sha256 of a buffer.
 */
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Downloads a file with retry logic and hashing.
 */
async function downloadFile(url, dest, source, meta = {}, retries = 4) {
  const absoluteDest = path.join(OUTPUT_ROOT, dest);
  ensureDir(path.dirname(absoluteDest));

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const buffer = await response.buffer();
    const sha256 = computeSha256(buffer);
    
    // Check for existing hash if needed or just overwrite
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
    downloadLogStream.write(JSON.stringify({ status: 'success', url, dest, sha256 }) + '\n');
    
    return manifestEntry;
  } catch (err) {
    if (retries > 0) {
      const waitTime = Math.pow(2, 4 - retries) * 1000;
      console.warn(`[WARN] Failed to download ${url}. Retrying in ${waitTime}ms... (${err.message})`);
      await new Promise(r => setTimeout(r, waitTime));
      return downloadFile(url, dest, source, meta, retries - 1);
    } else {
      console.error(`[ERROR] Permanent failure for ${url}: ${err.message}`);
      failuresStream.write(JSON.stringify({ url, dest, error: err.message, timestamp: new Date().toISOString() }) + '\n');
      return null;
    }
  }
}

async function fetchProducts() {
  const query = `
    query($cursor: String) {
      products(first: 50, after: $cursor) {
        pageInfo { hasNextPage, endCursor }
        nodes {
          id
          handle
          images(first: 50) {
            nodes { id, url, altText }
          }
        }
      }
    }
  `;

  let cursor = null;
  let hasNext = true;
  const results = [];

  console.log('Fetching Products...');
  while (hasNext) {
    const data = await shopifyGraphql(query, { cursor }, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_API_VERSION);
    results.push(...data.products.nodes);
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }
  return results;
}

async function fetchCollections() {
  const query = `
    query($cursor: String) {
      collections(first: 50, after: $cursor) {
        pageInfo { hasNextPage, endCursor }
        nodes {
          id
          handle
          image { url, altText }
        }
      }
    }
  `;

  let cursor = null;
  let hasNext = true;
  const results = [];

  console.log('Fetching Collections...');
  while (hasNext) {
    const data = await shopifyGraphql(query, { cursor }, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_API_VERSION);
    results.push(...data.collections.nodes);
    hasNext = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }
  return results;
}

async function fetchFiles() {
  const query = `
    query($cursor: String) {
      files(first: 50, after: $cursor) {
        pageInfo { hasNextPage, endCursor }
        nodes {
          id
          ... on MediaImage {
            image { url, altText }
          }
          ... on GenericFile {
            url
          }
        }
      }
    }
  `;

  let cursor = null;
  let hasNext = true;
  const results = [];

  console.log('Fetching Files...');
  while (hasNext) {
    const data = await shopifyGraphql(query, { cursor }, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_API_VERSION);
    results.push(...data.files.nodes);
    hasNext = data.files.pageInfo.hasNextPage;
    cursor = data.files.pageInfo.endCursor;
  }
  return results;
}

async function main() {
  ensureDir(OUTPUT_ROOT);
  ensureDir(MANIFESTS_DIR);
  ensureDir(DEDUPE_DIR);

  const tasks = [];

  // 1. Products
  const products = await fetchProducts();
  products.forEach(p => {
    p.images.nodes.forEach((img, idx) => {
      const ext = path.extname(new URL(img.url).pathname) || '.jpg';
      const dest = `products/${p.handle}/${idx}__${img.id.split('/').pop()}${ext}`;
      tasks.push(limit(() => downloadFile(img.url, dest, 'products', { shopify_id: img.id, owner_handle: p.handle })));
    });
  });

  // 2. Collections
  const collections = await fetchCollections();
  collections.forEach(c => {
    if (c.image) {
      const ext = path.extname(new URL(c.image.url).pathname) || '.jpg';
      const dest = `collections/${c.handle}/collection__${c.id.split('/').pop()}${ext}`;
      tasks.push(limit(() => downloadFile(c.image.url, dest, 'collections', { shopify_id: c.id, owner_handle: c.handle })));
    }
  });

  // 3. Files
  const files = await fetchFiles();
  files.forEach(f => {
    const url = f.image?.url || f.url;
    if (url) {
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const dest = `files/${f.id.split('/').pop()}${ext}`;
      tasks.push(limit(() => downloadFile(url, dest, 'files', { shopify_id: f.id })));
    }
  });

  console.log(`Queueing ${tasks.length} downloads...`);
  await Promise.all(tasks);

  console.log('Download complete.');
  manifestStream.end();
  downloadLogStream.end();
  failuresStream.end();
}

main().catch(err => {
  console.error('Fatal error in downloader:', err);
  process.exit(1);
});

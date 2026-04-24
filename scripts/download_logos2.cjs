/**
 * Downloads logos from alternative CDN sources
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '..', 'public', 'logos');

// Try multiple CDN sources for each brand
const sources = [
  // Firecrawl
  { name: 'firecrawl', url: 'https://cdn.simpleicons.org/firecrawl/FF6B4A' },
  { name: 'firecrawl2', url: 'https://raw.githubusercontent.com/mendableai/firecrawl/main/apps/www/public/firecrawl-logo.png' },
  // Runway  
  { name: 'runway2', url: 'https://cdn.simpleicons.org/runway/ffffff' },
  // Kling
  { name: 'kling', url: 'https://cdn.simpleicons.org/kling/ffffff' },
];

function download(src) {
  return new Promise((resolve) => {
    const handler = (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, handler).on('error', () => resolve(false));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length > 100) {
          const ext = buf[0] === 0x89 ? '.png' : (buf.toString().includes('<svg') ? '.svg' : '.dat');
          const filePath = path.join(LOGOS_DIR, src.name + ext);
          fs.writeFileSync(filePath, buf);
          console.log(`✅ ${src.name} (${buf.length} bytes) → ${filePath}`);
          resolve(true);
        } else {
          console.log(`❌ ${src.name} — too small (${buf.length} bytes)`);
          resolve(false);
        }
      });
    };
    https.get(src.url, handler).on('error', (e) => {
      console.log(`❌ ${src.name} — ${e.message}`);
      resolve(false);
    });
  });
}

async function main() {
  for (const src of sources) {
    await download(src);
    await new Promise(r => setTimeout(r, 500));
  }
}
main();

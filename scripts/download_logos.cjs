/**
 * CREASTILO — Logo Downloader
 * Downloads official brand SVG logos from Simple Icons CDN
 * and saves them locally to public/logos/ for zero-dependency rendering
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGOS_DIR = path.join(__dirname, '..', 'public', 'logos');

// Brand name → SimpleIcons slug + desired hex color
const brands = [
  { name: 'openai',      slug: 'openai',       color: 'ffffff' },
  { name: 'google-gemini', slug: 'googlegemini', color: '4285F4' },
  { name: 'anthropic',   slug: 'anthropic',    color: 'D4A574' },
  { name: 'n8n',         slug: 'n8n',          color: 'FF6D5A' },
  { name: 'make',        slug: 'make',         color: '6D00CC' },
  { name: 'supabase',    slug: 'supabase',     color: '3ECF8E' },
  { name: 'firebase',    slug: 'firebase',     color: 'DD2C00' },
  { name: 'docker',      slug: 'docker',       color: '2496ED' },
  { name: 'postgresql',  slug: 'postgresql',   color: '4169E1' },
  { name: 'mysql',       slug: 'mysql',        color: '4479A1' },
  { name: 'stripe',      slug: 'stripe',       color: '635BFF' },
  { name: 'shopify',     slug: 'shopify',      color: '7AB55C' },
  { name: 'whatsapp',    slug: 'whatsapp',     color: '25D366' },
  { name: 'gmail',       slug: 'gmail',        color: 'EA4335' },
  { name: 'runway',      slug: 'runwayml',     color: 'ffffff' },
  { name: 'hostinger',   slug: 'hostinger',    color: '673DE6' },
  { name: 'cloudflare',  slug: 'cloudflare',   color: 'F38020' },
  { name: 'vercel',      slug: 'vercel',       color: 'ffffff' },
  { name: 'github',      slug: 'github',       color: 'ffffff' },
];

// Ensure output directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  console.log(`📁 Created: ${LOGOS_DIR}`);
}

function downloadLogo(brand) {
  return new Promise((resolve, reject) => {
    const url = `https://cdn.simpleicons.org/${brand.slug}/${brand.color}`;
    const filePath = path.join(LOGOS_DIR, `${brand.name}.svg`);

    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', (chunk) => data += chunk);
          res2.on('end', () => {
            if (data.includes('<svg') || data.includes('<?xml')) {
              fs.writeFileSync(filePath, data);
              console.log(`✅ ${brand.name} → ${filePath}`);
              resolve(true);
            } else {
              console.log(`❌ ${brand.name} — Not a valid SVG (status ${res2.statusCode})`);
              resolve(false);
            }
          });
        }).on('error', (e) => {
          console.log(`❌ ${brand.name} — Redirect error: ${e.message}`);
          resolve(false);
        });
        return;
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (data.includes('<svg') || data.includes('<?xml')) {
          fs.writeFileSync(filePath, data);
          console.log(`✅ ${brand.name} → ${filePath}`);
          resolve(true);
        } else {
          console.log(`❌ ${brand.name} — Not a valid SVG (status ${res.statusCode})`);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log(`❌ ${brand.name} — Error: ${e.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 CREASTILO Logo Downloader — Fetching official brand SVGs...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const brand of brands) {
    const ok = await downloadLogo(brand);
    if (ok) success++; else failed++;
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Results: ${success} downloaded, ${failed} failed`);
  console.log(`📂 Logos saved to: ${LOGOS_DIR}`);
}

main();

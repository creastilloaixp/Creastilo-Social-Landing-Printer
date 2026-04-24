#!/usr/bin/env node
/**
 * generate-casto-assets.mjs — Generate assets for Casto Landing using WaveSpeed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'casto');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WAVESPEED_API_KEY = '5874472e119c8df09f1c6cfdb09f3423defbb1aed174bb314a54b6eeba0eba27';

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m'
};

const ASSETS = [
  {
    name: 'hero-deuda',
    prompt: 'A worried family in front of a modest house looking at financial documents with concern, warm amber and orange gradient background representing hope, modern cinematic style, photorealistic, 16:9 landscape, high quality'
  },
  {
    name: 'hero-inversion',
    prompt: 'Modern luxurious house renovation concept: classic home with renovation materials nearby, blueprint plans, tools, blue and gold gradient background representing wealth and opportunity, cinematic style, 16:9 landscape, photorealistic'
  },
  {
    name: 'familia-feliz',
    prompt: 'A happy family in front of their new home, moving day scenario with boxes, joyful atmosphere, golden hour lighting, warm amber and soft white colors, photorealistic, 16:9 landscape, emotional storytelling'
  },
  {
    name: 'propiedad-antes',
    prompt: 'Old distressed property needing renovation, abandoned house with peeling paint, overgrown garden, broken windows, realistic style, 16:9 landscape, showing investment opportunity'
  },
  {
    name: 'propiedad-despues',
    prompt: 'Beautiful modern renovated house, stunning contemporary home with fresh paint, manicured lawn, bright welcoming atmosphere, photorealistic, 16:9 landscape, cinematic lighting, transformation and value'
  },
  {
    name: 'oficina-legal',
    prompt: 'Elegant office with notarial documents, signing papers, modern architecture, deep navy blue and white color scheme representing trust and professionalism, photorealistic, 16:9 landscape, cinematic lighting'
  },
  {
    name: 'ciudad-mexico',
    prompt: 'Beautiful aerial view of Mexican city skyline, modern buildings, sunset sky, warm colors, cinematic, 16:9 landscape, photorealistic, Mexican real estate market'
  }
];

async function generateWithWaveSpeed(prompt) {
  const response = await fetch('https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      aspect_ratio: '16:9',
      enable_sync_mode: true
    })
  });

  const result = await response.json();
  
  if (result.code !== 200 && !result.data?.id) {
    throw new Error(result.detail || JSON.stringify(result));
  }

  const imageUrl = result.data.outputs?.[0];
  if (!imageUrl) {
    throw new Error('No image in response');
  }

  return imageUrl;
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

async function main() {
  console.log(`\n${colors.cyan}🚀 Generating Casto Assets${colors.reset}\n`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (const asset of ASSETS) {
    try {
      console.log(`${colors.blue}→${colors.reset} ${asset.name}...`);
      const imageUrl = await generateWithWaveSpeed(asset.prompt);
      const outputPath = path.join(OUTPUT_DIR, `${asset.name}.png`);
      const size = await downloadImage(imageUrl, outputPath);
      console.log(`   ${colors.green}✓${colors.reset} ${outputPath} (${(size/1024).toFixed(0)}KB)`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`   ${colors.red}✗${colors.reset} ${e.message}`);
    }
  }

  console.log(`\n${colors.green}✅ Done!${colors.reset}\n`);
}

main().catch(console.error);
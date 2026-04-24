#!/usr/bin/env node
/**
 * generate-scene.mjs — Step 2a: Generate cinematic hero images with Nano Banana
 *
 * Usage:
 *   node nano-banana-projects/generate-scene.mjs <brand.json> [scene_index]
 *   node nano-banana-projects/generate-scene.mjs --prompt "custom prompt" [output_dir]
 *
 * Uses Gemini 2.5 Flash Image (Nano Banana) to generate cinematic hero images
 * from brand analysis data or custom prompts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m'
};
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.bright}${colors.cyan}→${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

// ===== Generate image with Gemini 2.5 Flash Image (Nano Banana) =====
async function generateImage(prompt, outputPath) {
  log.step(`Generating image...`);
  log.info(`Prompt: ${prompt.substring(0, 100)}...`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    }
  );

  const result = await response.json();

  if (result.error) {
    throw new Error(`Gemini API error: ${result.error.message}`);
  }

  const parts = result.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const ext = part.inlineData.mimeType.split('/')[1] === 'jpeg' ? 'jpg' : 'png';
      const finalPath = outputPath.replace(/\.\w+$/, `.${ext}`);
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      fs.writeFileSync(finalPath, buffer);
      log.success(`Image saved: ${finalPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
      return finalPath;
    }
  }

  throw new Error('No image found in Gemini response');
}

// ===== Main =====
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
${colors.bright}Scene Generator — Step 2a of Cinematic Sites${colors.reset}

Usage:
  ${colors.cyan}From brand.json:${colors.reset}
    node nano-banana-projects/generate-scene.mjs <brand.json> [scene_index]
    node nano-banana-projects/generate-scene.mjs output/brand.json 0
    node nano-banana-projects/generate-scene.mjs output/brand.json all

  ${colors.cyan}Custom prompt:${colors.reset}
    node nano-banana-projects/generate-scene.mjs --prompt "A cinematic hero image..." [output_dir]

Scene index: 0, 1, 2 for specific scene, or "all" for all scenes.
    `);
    process.exit(1);
  }

  // Custom prompt mode
  if (args[0] === '--prompt') {
    const prompt = args[1];
    const outDir = args[2] || path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const filename = `scene-${Date.now()}.png`;
    await generateImage(prompt, path.join(outDir, filename));
    return;
  }

  // Brand.json mode
  const brandPath = args[0];
  const sceneIndex = args[1] || '0';

  if (!fs.existsSync(brandPath)) {
    log.error(`Brand file not found: ${brandPath}`);
    log.info('Run brand-analyzer.mjs first to generate brand.json');
    process.exit(1);
  }

  const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
  const outDir = path.dirname(brandPath);
  const scenes = brand.suggestedHeroScenes || [];

  if (scenes.length === 0) {
    log.error('No hero scenes found in brand.json');
    process.exit(1);
  }

  log.info(`🎬 Step 2a: Scene Generation for ${brand.companyName}\n`);

  const indices = sceneIndex === 'all'
    ? scenes.map((_, i) => i)
    : [parseInt(sceneIndex)];

  const generated = [];

  for (const idx of indices) {
    if (idx >= scenes.length) {
      log.warn(`Scene index ${idx} out of range (${scenes.length} scenes available)`);
      continue;
    }

    const scene = scenes[idx];
    console.log(`\n${colors.bright}Scene ${idx + 1}: ${scene.title}${colors.reset}`);

    // Enhance the prompt with brand context
    const enhancedPrompt = `${scene.prompt}. Brand colors: ${brand.colors.primary}, ${brand.colors.secondary}, ${brand.colors.accent}. Style: ultra-premium, cinematic, 16:9 widescreen aspect ratio, photorealistic, high detail, professional commercial photography, dramatic lighting.`;

    const safeName = brand.companyName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents: é→e, ñ→n
      .replace(/[^a-z0-9\s-]/g, '')                    // remove illegal chars (|, <, >, :, etc.)
      .replace(/\s+/g, '-')                             // spaces to dashes
      .replace(/-+/g, '-')                              // collapse multiple dashes
      .substring(0, 40);                                // max 40 chars to keep paths short
    const filename = `scene-${idx + 1}-${safeName}-${Date.now()}.png`;

    const imagePath = await generateImage(enhancedPrompt, path.join(outDir, filename));
    generated.push({ index: idx, title: scene.title, path: imagePath, animationHint: scene.animationHint });
  }

  // Save generation manifest
  const manifestPath = path.join(outDir, 'scenes.json');
  const manifest = {
    brand: brand.companyName,
    generatedAt: new Date().toISOString(),
    scenes: generated
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n${colors.bright}${colors.green}✨ Scene Generation Complete!${colors.reset}`);
  console.log(`  Generated: ${generated.length} scene(s)`);
  generated.forEach(s => {
    console.log(`  ${colors.cyan}${s.index + 1}. ${s.title}${colors.reset} → ${s.path}`);
  });
  console.log(`\n  Next: ${colors.cyan}node nano-banana-projects/animate-scene.mjs "${generated[0]?.path}" "${generated[0]?.animationHint || 'slow cinematic zoom'}"${colors.reset}`);
}

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});

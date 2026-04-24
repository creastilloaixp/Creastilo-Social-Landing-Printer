#!/usr/bin/env node
/**
 * generate-hero-wavespeed.mjs — Generate hero image with FLUX via WaveSpeed
 * WaveSpeed has multiple models: FLUX (text-to-image), Nano Banana (image editing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WAVESPEED_API_KEY = '5874472e119c8df09f1c6cfdb09f3423defbb1aed174bb314a54b6eeba0eba27';

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

async function generateWithNanoBanana(prompt, outputPath, options = {}) {
  const {
    aspectRatio = '16:9',
    enableSync = false
  } = options;

  log.step('Generating image with FLUX Dev via WaveSpeed...');
  log.info(`Prompt: ${prompt.substring(0, 80)}...`);

  const model = 'google/nano-banana-2/text-to-image';

  const body = {
    prompt: prompt,
    aspect_ratio: aspectRatio,
    enable_sync_mode: enableSync
  };

  log.info(`Model: ${model}`);

  const response = await fetch(`https://api.wavespeed.ai/api/v3/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (result.code !== 200 && !result.data?.id) {
    if (result.detail) {
      throw new Error(`WaveSpeed API error: ${result.detail}`);
    }
    throw new Error(`WaveSpeed API error: ${JSON.stringify(result)}`);
  }

  const taskId = result.data.id;
  log.success(`Task submitted: ${taskId}`);
  
  let statusUrl = result.data.urls?.get;
  if (!statusUrl) {
    statusUrl = `https://api.wavespeed.ai/api/v3/predictions/${taskId}`;
  }
  
  if (enableSync) {
    const outputUrl = result.data.outputs?.[0];
    if (outputUrl) {
      log.success(`Image ready: ${outputUrl}`);
      return outputUrl;
    }
  }

  log.step('Polling for result...');
  if (!statusUrl) {
    statusUrl = `https://api.wavespeed.ai/api/v3/predictions/${taskId}`;
  }
  log.info(`Status URL: ${statusUrl}`);

  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const statusResponse = await fetch(statusUrl, {
      headers: { 'Authorization': `Bearer ${WAVESPEED_API_KEY}` }
    });

    const responseText = await statusResponse.text();
    let statusResult;
    try {
      statusResult = JSON.parse(responseText);
    } catch (e) {
      log.warn(`Non-JSON response: ${responseText.substring(0, 200)}`);
      continue;
    }

    const status = statusResult.data?.status;

    log.info(`[${i * 3}s] Status: ${status}`);

    if (status === 'completed') {
      const outputs = statusResult.data.outputs || [];
      if (outputs.length === 0) throw new Error('No output images');
      log.success(`Image ready: ${outputs[0]}`);
      return outputs[0];
    }

    if (status === 'failed') {
      throw new Error(`Generation failed: ${statusResult.data?.error}`);
    }
  }

  throw new Error('Timeout waiting for image generation');
}

async function downloadImage(url, outputPath) {
  log.step('Downloading image...');

  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(outputPath, buffer);
  log.success(`Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return outputPath;
}

async function main() {
  const args = process.argv.slice(2);
  
  let prompt = args[0];
  if (!prompt) {
    prompt = 'A stunning cinematic hero image for Creastilo AI Framework - a sophisticated SaaS platform. Dark elegant background with abstract neural network nodes glowing in cyan and orange. Futuristic holographic UI elements, floating data panels, AI brain visualization. Deep navy blue, electric cyan, warm amber accents. Technology, innovation, artificial intelligence theme. 16:9 landscape, ultra detailed, 8K quality, photorealistic, premium luxury tech aesthetic';
  }
  
  const outputDir = args[1] || './landing/public';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `hero-${Date.now()}.png`);

  try {
    const imageUrl = await generateWithNanoBanana(prompt, outputPath, {
      aspectRatio: '16:9',
      enableSync: true
    });

    await downloadImage(imageUrl, outputPath);

    console.log(`\n${colors.green}✨ Hero image generated!${colors.reset}`);
    console.log(`   Path: ${outputPath}`);
    console.log(`\n   Next: node nano-banana-projects/animate-scene.mjs "${outputPath}" "Slow cinematic zoom, subtle glow animation, particles floating" 5 ./landing/public --wavespeed`);

  } catch (error) {
    log.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
/**
 * animate-scene.mjs — Step 2b: Animate hero image to video with Kling AI
 *
 * Usage:
 *   node nano-banana-projects/animate-scene.mjs <image_path> "<animation_prompt>" [duration] [output_dir]
 *
 * Supports two backends:
 *   1. Kling Direct API (default if KLING_ACCESS_KEY is set)
 *   2. WaveSpeed API (fallback if WAVESPEED_API_KEY is set)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API Keys
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;

// Determine which backend to use
const USE_KLING_DIRECT = !!KLING_ACCESS_KEY;

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

// ===== Convert local image to base64 =====
function imageToBase64(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  return buffer.toString('base64');
}

function imageToDataUri(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

// ============================================================
//  BACKEND 1: Kling Direct API (JWT Auth)
// ============================================================

function createKlingJWT() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: KLING_ACCESS_KEY,
    exp: now + 1800,  // 30 min
    nbf: now - 5,
    iat: now
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', KLING_SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function klingSubmit(imagePath, prompt, duration) {
  log.step('Submitting to Kling AI Direct API...');

  const token = createKlingJWT();
  const imageBase64 = imageToBase64(imagePath);

  log.info(`Image: ${path.basename(imagePath)} (${(fs.statSync(imagePath).size / 1024).toFixed(0)}KB)`);
  log.info(`Prompt: ${prompt}`);
  log.info(`Duration: ${duration}s`);
  log.info(`Model: kling-v2-master`);

  const body = {
    model_name: 'kling-v2-master',
    image: imageBase64,
    prompt: prompt,
    negative_prompt: 'blurry, low quality, distorted, watermark, text overlay, glitch, artifacts',
    mode: 'pro',
    duration: String(duration),
    cfg_scale: 0.5
  };

  const response = await fetch('https://api.klingai.com/v1/videos/image2video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (result.code !== 0 || !result.data?.task_id) {
    log.error(`Response: ${JSON.stringify(result)}`);
    throw new Error(`Kling API error: ${result.message || JSON.stringify(result)}`);
  }

  const taskId = result.data.task_id;
  log.success(`Task submitted: ${taskId}`);
  return { taskId, backend: 'kling' };
}

async function klingPoll(taskId, maxWaitMs = 600000) {
  log.step('Waiting for Kling video generation...');

  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const token = createKlingJWT();

    const response = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    const status = result.data?.task_status;

    if (status !== lastStatus) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      log.info(`[${elapsed}s] Status: ${status}`);
      lastStatus = status;
    }

    if (status === 'succeed') {
      const videos = result.data?.task_result?.videos || [];
      if (videos.length === 0) throw new Error('No videos in result');
      log.success(`Video ready! (${((Date.now() - startTime) / 1000).toFixed(0)}s)`);
      return videos.map(v => v.url);
    }

    if (status === 'failed') {
      throw new Error(`Generation failed: ${result.data?.task_status_msg || JSON.stringify(result.data)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error(`Timeout after ${maxWaitMs / 1000}s`);
}

// ============================================================
//  BACKEND 2: WaveSpeed API (Bearer Token)
// ============================================================

async function wavespeedSubmit(imagePath, prompt, duration) {
  log.step('Submitting to WaveSpeed (Kling via proxy)...');

  const imageData = imageToDataUri(imagePath);
  log.info(`Image: ${path.basename(imagePath)} (${(fs.statSync(imagePath).size / 1024).toFixed(0)}KB)`);
  log.info(`Prompt: ${prompt}`);
  log.info(`Duration: ${duration}s`);

  const model = 'kwaivgi/kling-v2.1-i2v-pro';

  const body = {
    image: imageData,
    prompt: prompt,
    negative_prompt: 'blurry, low quality, distorted, watermark, text overlay, glitch, artifacts',
    duration: duration,
    cfg_scale: 0.5
  };

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
    throw new Error(`WaveSpeed API error: ${JSON.stringify(result)}`);
  }

  const taskId = result.data.id;
  const statusUrl = result.data.urls?.get || `https://api.wavespeed.ai/api/v3/predictions/${taskId}`;

  log.success(`Task submitted: ${taskId}`);
  return { taskId, statusUrl, backend: 'wavespeed' };
}

async function wavespeedPoll(statusUrl, maxWaitMs = 600000) {
  log.step('Waiting for WaveSpeed video generation...');

  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(statusUrl, {
      headers: { 'Authorization': `Bearer ${WAVESPEED_API_KEY}` }
    });

    const result = await response.json();
    const status = result.data?.status;

    if (status !== lastStatus) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      log.info(`[${elapsed}s] Status: ${status}`);
      lastStatus = status;
    }

    if (status === 'completed') {
      const outputs = result.data.outputs || [];
      if (outputs.length === 0) throw new Error('No output videos in response');
      log.success(`Video ready! (${((Date.now() - startTime) / 1000).toFixed(0)}s)`);
      return outputs;
    }

    if (status === 'failed') {
      throw new Error(`Generation failed: ${JSON.stringify(result.data)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error(`Timeout after ${maxWaitMs / 1000}s`);
}

// ===== Download video =====
async function downloadVideo(videoUrl, outputPath) {
  log.step('Downloading video...');

  const response = await fetch(videoUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(outputPath, buffer);
  log.success(`Video saved: ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
  return outputPath;
}

// ===== Main =====
async function main() {
  const args = process.argv.slice(2);

  // Check for --wavespeed flag to force WaveSpeed backend
  const forceWavespeed = args.includes('--wavespeed');
  const filteredArgs = args.filter(a => a !== '--wavespeed');
  const [imagePath, animationPrompt, durationStr, outputDir] = filteredArgs;

  if (!imagePath || !animationPrompt) {
    console.log(`
${colors.bright}Scene Animator — Step 2b of Cinematic Sites${colors.reset}

Usage:
  node nano-banana-projects/animate-scene.mjs <image_path> "<animation_prompt>" [duration] [output_dir] [--wavespeed]

Examples:
  node nano-banana-projects/animate-scene.mjs output/scene-1.png "Slow cinematic zoom into the bowl, steam rising gently" 5
  node nano-banana-projects/animate-scene.mjs output/scene-1.png "Camera pans left revealing the cityscape" 10 ./output
  node nano-banana-projects/animate-scene.mjs output/scene-1.png "Zoom in slowly" 5 ./output --wavespeed

Parameters:
  image_path        Path to the hero image (PNG/JPG)
  animation_prompt  Description of how the scene should animate
  duration          Video length in seconds: 5 (default) or 10
  output_dir        Where to save the video (default: same as image)
  --wavespeed       Force WaveSpeed backend instead of Kling Direct

Backends:
  ${colors.cyan}Kling Direct API${colors.reset} (default) — uses KLING_ACCESS_KEY + KLING_SECRET_KEY
  ${colors.cyan}WaveSpeed API${colors.reset} (fallback)  — uses WAVESPEED_API_KEY
    `);
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    log.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  const duration = parseInt(durationStr) || 5;
  const outDir = outputDir || path.dirname(imagePath);
  const useKling = USE_KLING_DIRECT && !forceWavespeed;

  try {
    log.info(`🎬 Step 2b: Animating scene`);
    log.info(`Backend: ${useKling ? 'Kling Direct API' : 'WaveSpeed API'}\n`);

    let videoUrls;

    if (useKling) {
      const { taskId } = await klingSubmit(imagePath, animationPrompt, duration);
      videoUrls = await klingPoll(taskId);
    } else {
      const { statusUrl } = await wavespeedSubmit(imagePath, animationPrompt, duration);
      videoUrls = await wavespeedPoll(statusUrl);
    }

    // Download all output videos
    const downloaded = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const basename = path.basename(imagePath, path.extname(imagePath));
      const videoFilename = `${basename}-video-${i + 1}.mp4`;
      const videoPath = path.join(outDir, videoFilename);
      await downloadVideo(videoUrls[i], videoPath);
      downloaded.push(videoPath);
    }

    console.log(`\n${colors.bright}${colors.green}✨ Animation Complete!${colors.reset}`);
    downloaded.forEach(p => console.log(`  ${colors.cyan}${p}${colors.reset}`));
    console.log(`\n  Next: ${colors.cyan}node nano-banana-projects/extract-frames.mjs "${downloaded[0]}" 60${colors.reset}`);

  } catch (error) {
    log.error(`Error: ${error.message}`);

    // If Kling Direct failed, suggest WaveSpeed fallback
    if (useKling && WAVESPEED_API_KEY) {
      log.warn('Tip: Try --wavespeed flag to use WaveSpeed as fallback');
    }
    process.exit(1);
  }
}

main();

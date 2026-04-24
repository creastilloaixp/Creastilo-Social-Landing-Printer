#!/usr/bin/env node
/**
 * extract-frames.mjs — Step 2c: Extract video frames for scroll-driven animation
 *
 * Usage:
 *   node nano-banana-projects/extract-frames.mjs <video_path> [num_frames] [output_dir]
 *
 * Extracts individual frames from a video using ffmpeg-static (bundled, no install needed).
 * Frames are numbered sequentially for use in scroll-driven cinematic websites.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

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

// ===== Get ffmpeg path =====
function getFFmpegPath() {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    return ffmpegStatic;
  } catch {
    // Fallback to system ffmpeg
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      return 'ffmpeg';
    } catch {
      return null;
    }
  }
}

// ===== Get video info =====
function getVideoInfo(ffmpegPath, videoPath) {
  const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');

  try {
    // Try ffprobe first
    const result = execSync(
      `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=duration,r_frame_rate,width,height -of json "${videoPath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const info = JSON.parse(result);
    const stream = info.streams[0];
    const [num, den] = (stream.r_frame_rate || '30/1').split('/');
    return {
      duration: parseFloat(stream.duration) || 5,
      fps: parseInt(num) / parseInt(den),
      width: stream.width,
      height: stream.height
    };
  } catch {
    // Default fallback
    return { duration: 5, fps: 30, width: 1920, height: 1080 };
  }
}

// ===== Extract frames =====
function extractFrames(ffmpegPath, videoPath, numFrames, outputDir) {
  log.step(`Extracting ${numFrames} frames...`);

  const framesDir = path.join(outputDir, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const videoInfo = getVideoInfo(ffmpegPath, videoPath);
  log.info(`Video: ${videoInfo.duration}s, ${videoInfo.fps}fps, ${videoInfo.width}x${videoInfo.height}`);

  // Calculate fps needed to get desired number of frames
  const extractFps = numFrames / videoInfo.duration;

  const cmd = `"${ffmpegPath}" -i "${videoPath}" -vf "fps=${extractFps},scale=1920:-2" -q:v 2 -start_number 0 "${path.join(framesDir, 'frame-%04d.jpg')}" -y`;

  log.info(`Running ffmpeg (extracting at ${extractFps.toFixed(2)} fps)...`);

  try {
    execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    // ffmpeg may output to stderr even on success
    const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'));
    if (files.length === 0) throw new Error(`ffmpeg failed: ${error.message}`);
  }

  const frames = fs.readdirSync(framesDir)
    .filter(f => f.endsWith('.jpg'))
    .sort();

  log.success(`Extracted ${frames.length} frames to ${framesDir}`);
  return { framesDir, frameCount: frames.length, frames };
}

// ===== Generate scroll-driven HTML preview =====
function generateScrollPreview(framesDir, frameCount, outputDir) {
  log.step('Generating scroll-driven preview...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scroll-Driven Animation Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    height: ${frameCount * 60}vh;
    background: #000;
  }
  .scroll-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  #hero-canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    z-index: 1000;
    transition: width 0.05s linear;
  }
  .frame-counter {
    position: fixed;
    bottom: 20px;
    right: 20px;
    color: white;
    font-family: monospace;
    font-size: 14px;
    background: rgba(0,0,0,0.7);
    padding: 8px 16px;
    border-radius: 8px;
    z-index: 1000;
  }
  .scroll-hint {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,0.6);
    font-family: system-ui;
    font-size: 14px;
    animation: bounce 2s infinite;
    z-index: 1000;
  }
  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(-10px); }
  }
</style>
</head>
<body>
<div class="progress-bar" id="progress"></div>
<div class="scroll-container">
  <canvas id="hero-canvas"></canvas>
</div>
<div class="frame-counter" id="counter">Frame: 0 / ${frameCount}</div>
<div class="scroll-hint">↓ Scroll to animate ↓</div>

<script>
const TOTAL_FRAMES = ${frameCount};
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const counter = document.getElementById('counter');
const progress = document.getElementById('progress');

// Preload all frames
const frames = [];
let loadedCount = 0;

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const img = new Image();
  img.src = 'frames/frame-' + String(i).padStart(4, '0') + '.jpg';
  img.onload = () => {
    loadedCount++;
    if (loadedCount === 1) {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    }
    if (loadedCount === TOTAL_FRAMES) {
      document.querySelector('.scroll-hint').textContent = '↓ Scroll to animate ↓ (All frames loaded!)';
    }
  };
  frames.push(img);
}

// Scroll-driven animation
let currentFrame = 0;

function updateFrame() {
  const scrollTop = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = Math.min(scrollTop / maxScroll, 1);
  const frameIndex = Math.min(Math.floor(scrollFraction * TOTAL_FRAMES), TOTAL_FRAMES - 1);

  if (frameIndex !== currentFrame && frames[frameIndex]?.complete) {
    currentFrame = frameIndex;
    canvas.width = frames[frameIndex].width;
    canvas.height = frames[frameIndex].height;
    ctx.drawImage(frames[frameIndex], 0, 0);
    counter.textContent = 'Frame: ' + frameIndex + ' / ' + TOTAL_FRAMES;
    progress.style.width = (scrollFraction * 100) + '%';
  }

  requestAnimationFrame(updateFrame);
}

requestAnimationFrame(updateFrame);
</script>
</body>
</html>`;

  const previewPath = path.join(outputDir, 'scroll-preview.html');
  fs.writeFileSync(previewPath, html);
  log.success(`Scroll preview saved: ${previewPath}`);
  return previewPath;
}

// ===== Main =====
async function main() {
  const [,, videoPath, numFramesStr, outputDir] = process.argv;

  if (!videoPath) {
    console.log(`
${colors.bright}Frame Extractor — Step 2c of Cinematic Sites${colors.reset}

Usage:
  node nano-banana-projects/extract-frames.mjs <video_path> [num_frames] [output_dir]

Examples:
  node nano-banana-projects/extract-frames.mjs output/scene-video.mp4 60
  node nano-banana-projects/extract-frames.mjs output/scene-video.mp4 90 ./output

Parameters:
  video_path   Path to the animated video (MP4)
  num_frames   Number of frames to extract (default: 60, recommended: 60-120)
  output_dir   Where to save frames (default: same directory as video)

Output:
  frames/         Directory with numbered JPG frames
  scroll-preview.html  Interactive scroll-driven preview

Note: Uses ffmpeg-static (bundled via npm). No system ffmpeg needed.
    `);
    process.exit(1);
  }

  if (!fs.existsSync(videoPath)) {
    log.error(`Video not found: ${videoPath}`);
    process.exit(1);
  }

  const numFrames = parseInt(numFramesStr) || 60;
  const outDir = outputDir || path.dirname(videoPath);

  const ffmpegPath = getFFmpegPath();
  if (!ffmpegPath) {
    log.error('ffmpeg not found! Run: npm install ffmpeg-static');
    process.exit(1);
  }

  log.info(`🎞️ Step 2c: Frame Extraction\n`);
  log.info(`Using ffmpeg: ${ffmpegPath}`);

  try {
    const { framesDir, frameCount } = extractFrames(ffmpegPath, videoPath, numFrames, outDir);
    const previewPath = generateScrollPreview(framesDir, frameCount, outDir);

    console.log(`\n${colors.bright}${colors.green}✨ Frame Extraction Complete!${colors.reset}`);
    console.log(`  Frames: ${colors.cyan}${frameCount}${colors.reset} extracted to ${framesDir}`);
    console.log(`  Preview: ${colors.cyan}${previewPath}${colors.reset}`);
    console.log(`\n  Open scroll-preview.html in browser to test the scroll animation.`);
    console.log(`  Then proceed to Step 3: Build the full cinematic website.`);

  } catch (error) {
    log.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

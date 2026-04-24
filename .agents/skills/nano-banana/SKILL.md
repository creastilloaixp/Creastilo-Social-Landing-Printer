# Skill: Nano Banana Cinema
Direct cinematic sequence generation for high-end scroll interfaces.

## Description
This skill automates the creation of 60-frame interpolated visual sequences using Gemini Imagen 3/4. It takes a start-state and an end-state from `.nano_banana` and synthesizes a consistent cinematic progression.

## Integration
- **Engine (Images)**: `scripts/nano_banana_gen.js`
- **Engine (Video)**: `scripts/nano_banana_video.js` (NEW: Uses VEO 3.1)
- **Config**: `.nano_banana`
- **UI**: Integrated into `X-Command Center` (Generator Module)

## Usage
1. Configure `.nano_banana`.
2. Run `node scripts/nano_banana_video.js` for full .mp4 synthesis.
3. Run `node scripts/nano_banana_gen.js` for scroll-sequence frames.
3. Check `/public/frames` for the result.
4. The frontend `ScrollSequencer` will automatically bind to these frames.

---
name: cinematic-sites
description: |
  Agente que construye sitios web cinematográficos premium de manera automatizada.
  Analiza un sitio web existente, extrae la identidad de marca, genera escenas cinematográficas
  con IA (Nano Banana + Kling 3.0), construye un sitio web scroll-driven con módulos cinemáticos,
  y lo despliega en Vercel.
  Activa cuando el usuario mencione: cinematic site, sitio cinematográfico, website premium,
  landing cinematica, mejorar website, rebuild website, cinematic landing, hero animation.
triggers:
  - cinematic site
  - cinematic sites
  - sitio cinematográfico
  - website premium
  - landing cinematica
  - mejorar website
  - rebuild website
  - cinematic landing
  - hero animation
  - cinematic hero
  - scroll-driven
  - premium website
tools:
  - Bash
  - Read
  - Write
  - WebFetch
  - mcp__claude_ai_Vercel__deploy_to_vercel
---

# Cinematic Sites — Agent Skill

Build $15K-quality cinematic websites on autopilot. This skill guides the agent through
a 4-step pipeline: Brand Analysis → Scene Generation → Website Build → Deploy.

---

## STEP 1: Brand Analysis

**Goal:** Extract the complete brand identity from an existing website.

**Process:**
1. Run the brand analyzer script:
```bash
node nano-banana-projects/brand-analyzer.mjs "<WEBSITE_URL>" "./nano-banana-projects/output"
```

2. This produces:
   - `output/brand.json` — Complete brand data (colors, fonts, industry, scenes)
   - `output/brand-card.html` — Visual brand card for approval

3. Open `brand-card.html` and present to the user for review.

4. **PAUSE POINT:** Ask the user to approve the brand card before continuing.
   The brand card includes:
   - Company name, industry, tagline
   - Color palette (primary, secondary, accent, background, text)
   - Typography (heading + body fonts, style)
   - Hero headline + subheadline
   - 3 suggested hero scene concepts with animation hints
   - Contact info, address, hours (if found)

**If user wants changes:** Modify `brand.json` manually and regenerate the brand card.

**No external tools required.** The script uses Gemini for analysis and fetch for scraping.

---

## STEP 2: Scene Generation (Image + Video)

**Goal:** Generate a cinematic hero image and animate it into a video.

### Step 2a: Generate Hero Image (Nano Banana)

Use the scene generator to create images based on brand analysis:

```bash
# Generate specific scene (0, 1, or 2)
node nano-banana-projects/generate-scene.mjs "nano-banana-projects/output/brand.json" 0

# Generate all scenes
node nano-banana-projects/generate-scene.mjs "nano-banana-projects/output/brand.json" all

# Custom prompt
node nano-banana-projects/generate-scene.mjs --prompt "Your custom prompt here" "./output"
```

**API Used:** Gemini 2.5 Flash Image (Nano Banana) via Google Generative AI API.
- Model: `gemini-2.5-flash-image`
- Free with Google API key ($300 welcome credit per account)
- Env: `GEMINI_API_KEY`

**PAUSE POINT:** Show generated images to user. Let them pick which to animate.

### Step 2b: Animate to Video (Kling 3.0)

Animate the selected image using Kling 3.0 via WaveSpeed:

```bash
node nano-banana-projects/animate-scene.mjs "<IMAGE_PATH>" "<ANIMATION_PROMPT>" [DURATION] [OUTPUT_DIR]
```

Parameters:
- `IMAGE_PATH`: Path to the hero image (PNG/JPG)
- `ANIMATION_PROMPT`: How the scene should animate. Examples:
  - "Slow cinematic zoom into the product, subtle light shifts"
  - "Camera pans left revealing the cityscape, particles float"
  - "Steam rises gently, camera slowly pulls back"
  - "Ingredients settle into the bowl, camera zooms in"
- `DURATION`: 5 (default) or 10 seconds
- Cost: ~$0.56/5s, ~$1.12/10s

**API Used:** Kling V2.1 Pro via WaveSpeed API
- Model: `kwaivgi/kling-v2.1-i2v-pro`
- Env: `WAVESPEED_API_KEY`

**Alternative models available:**
- `kwaivgi/kling-v3.0-pro-image-to-video` (highest quality, ~$0.56/5s)
- `kwaivgi/kling-v2.6-pro-image-to-video` (good quality)
- `kwaivgi/kling-v2.1-i2v-pro` (default, balanced)

### Step 2c: Extract Frames

Extract individual frames from the video for scroll-driven animation:

```bash
node nano-banana-projects/extract-frames.mjs "<VIDEO_PATH>" [NUM_FRAMES] [OUTPUT_DIR]
```

- Recommended: 60-90 frames for a smooth scroll experience
- Uses ffmpeg-static (bundled via npm, no system install needed)
- Outputs: `frames/` directory + `scroll-preview.html`

Open `scroll-preview.html` to verify the scroll animation works.

---

## STEP 3: Website Build

**Goal:** Build a complete, responsive cinematic website.

### Architecture Rules

The website MUST follow this structure:

```
cinematic-site/
├── index.html           # Main page
├── styles.css           # All styles
├── script.js            # All interactions
├── frames/              # Extracted video frames (from Step 2c)
│   ├── frame-0000.jpg
│   ├── frame-0001.jpg
│   └── ...
└── assets/              # Additional images, fonts
```

### Design System

1. **Colors:** Use the exact palette from `brand.json`
2. **Typography:** Use the fonts specified in `brand.json` (via Google Fonts)
3. **Dark theme by default** — all cinematic sites use dark backgrounds
4. **Spacing:** Use 8px grid system (8, 16, 24, 32, 48, 64, 80, 120)
5. **Border radius:** 8px for cards, 12px for large containers, 50px for buttons
6. **Shadows:** Use rgba(0,0,0,0.3-0.6) for depth

### Scroll-Driven Hero (CORE TECHNIQUE)

The hero section uses the scroll video player module. This is how it works:

1. All extracted frames are preloaded as Image objects
2. A `<canvas>` element fills the viewport (100vw x 100vh)
3. On scroll, calculate: `frameIndex = scrollFraction * totalFrames`
4. Draw the corresponding frame on the canvas
5. `body` height controls total scroll distance (use `500vh` for 60 frames)

```javascript
// Core scroll-driven frame logic
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
const TOTAL_FRAMES = 60; // Match your frame count

const frames = [];
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const img = new Image();
  img.src = `frames/frame-${String(i).padStart(4, '0')}.jpg`;
  frames.push(img);
}

let currentFrame = -1;
window.addEventListener('scroll', () => {
  requestAnimationFrame(() => {
    const scrollFraction = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const frameIndex = Math.min(Math.floor(scrollFraction * TOTAL_FRAMES), TOTAL_FRAMES - 1);
    if (frameIndex !== currentFrame && frames[frameIndex]?.complete) {
      currentFrame = frameIndex;
      ctx.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height);
    }
  });
});
```

### Cinematic Modules Integration

Choose appropriate modules from `nano-banana-projects/cinematic-modules/`:

| Module | File | Use When |
|--------|------|----------|
| Scroll Video Player | `01-scroll-video-player.html` | ALWAYS — this is the hero |
| Accordion Slider | `02-accordion-slider.html` | Menus, product categories, portfolios |
| Kinetic Text | `03-kinetic-text.html` | Brand statements, statistics counters |
| Reveal Text | `04-reveal-text.html` | Section headers, brand story |
| Typewriter | `05-typewriter.html` | Taglines, code showcases |
| Glitch Effect | `06-glitch-effect.html` | Tech brands, bold headers |
| Image Trail | `07-image-trail.html` | Creative portfolios, flower shops |
| Flip Cards | `08-flip-cards.html` | Services, team, testimonials |
| SVG Draw | `09-svg-draw.html` | Logos, decorative elements |
| Parallax Hero | `10-parallax-hero.html` | Alternative hero style (if no video) |
| Smooth Scroll Nav | `11-smooth-scroll-nav.html` | ALWAYS — single-page navigation |

**Module selection guidelines:**
- **Restaurant/Food:** Accordion slider (menu), Kinetic text (stats), Reveal text (story)
- **Agency/Tech:** Glitch effect, Typewriter (code), Flip cards (services)
- **Fashion/Creative:** Image trail, Parallax, Accordion slider
- **Insurance/Finance:** SVG draw (shield icon), Flip cards, Kinetic text (stats)
- **E-commerce:** Accordion slider (products), Flip cards, Reveal text

### Responsive Design Rules

1. Mobile-first approach
2. Breakpoints: 768px (tablet), 1024px (desktop), 1440px (wide)
3. Hero canvas: `object-fit: cover` on all viewports
4. Navigation: hamburger menu on mobile
5. Text scales with `clamp()` for fluid typography
6. Touch-friendly tap targets (min 44px)

### Sections to Include

Every cinematic site should have:
1. **Hero** — Scroll-driven video with headline overlay
2. **About/Story** — Brand narrative with reveal text
3. **Services/Features** — Flip cards or accordion
4. **Social Proof** — Stats counters with kinetic text
5. **CTA** — Final call-to-action with contact info
6. **Footer** — Links, address, hours, social icons

---

## STEP 4: Deploy

**Goal:** Deploy the website to Vercel for public access.

### Using Vercel MCP Tool

```
Use mcp__claude_ai_Vercel__deploy_to_vercel to deploy the cinematic-site/ directory.
```

### Manual CLI Deploy

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy from the build directory
cd cinematic-site/
vercel --yes
```

The deployed URL is immediately shareable with the client.

---

## Full Pipeline Command Reference

```bash
# Step 1: Analyze brand
node nano-banana-projects/brand-analyzer.mjs "https://example.com" "./nano-banana-projects/output"

# Step 2a: Generate hero image
node nano-banana-projects/generate-scene.mjs "nano-banana-projects/output/brand.json" 0

# Step 2b: Animate to video
node nano-banana-projects/animate-scene.mjs "nano-banana-projects/output/scene-1.png" "Slow cinematic zoom, dramatic lighting" 5

# Step 2c: Extract frames
node nano-banana-projects/extract-frames.mjs "nano-banana-projects/output/scene-1-video-1.mp4" 60 "nano-banana-projects/output"

# Step 3: Build website (agent generates HTML/CSS/JS using modules)

# Step 4: Deploy
vercel ./cinematic-site --yes
```

---

## Cost Per Website

| Component | Cost | Notes |
|-----------|------|-------|
| Brand Analysis | $0.00 | Gemini free tier |
| Image Generation | $0.00 | Gemini free tier |
| Video Animation | ~$0.56 - $1.12 | WaveSpeed (Kling) per video |
| Frame Extraction | $0.00 | Local ffmpeg |
| Deploy | $0.00 | Vercel free tier |
| **Total** | **~$0.56 - $2.00** | Per complete website |

---

## Troubleshooting

**Image generation fails:**
- Check `GEMINI_API_KEY` in `.env`
- Ensure model `gemini-2.5-flash-image` is available (run `list-models.mjs`)

**Video animation fails:**
- Check `WAVESPEED_API_KEY` in `.env`
- Ensure image is < 10MB and dimensions between 300px-2048px
- Try reducing duration to 5s

**Frame extraction fails:**
- Ensure ffmpeg-static is installed: `npm install ffmpeg-static`
- Check video file is valid MP4

**Scroll animation is choppy:**
- Reduce frame count (60 is ideal for most cases)
- Ensure frames are JPG (not PNG) for smaller file size
- Use quality level 2-3 in ffmpeg for good balance

---

## Video Original de Referencia

[This AI Agent Builds $15K Cinematic Websites on Autopilot (Claude Code + Nanobanana 2)](https://www.youtube.com/watch?v=bUt1WpDlI6E)
Por: Jay E | RoboNuggets

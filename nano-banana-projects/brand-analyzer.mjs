#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const log = {
  info: (msg) => console.log(`ℹ ${msg}`),
  success: (msg) => console.log(`✓ ${msg}`),
  error: (msg) => console.log(`✗ ${msg}`),
  step: (msg) => console.log(`\n→ ${msg}`)
};

// Simplified generateBrandCard for stability
function generateBrandCard(brand, strategy) {
    const devManifest = JSON.stringify({
        colors: brand.colors,
        typography: brand.typography,
        ctas: strategy?.visualIdentity?.conversionMap || []
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #050505; color: white; font-family: sans-serif; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="p-8">
    <div class="max-w-4xl mx-auto glass-panel p-8 bg-white/5 rounded-3xl">
        <div class="flex gap-4 mb-8 border-b border-white/10 pb-4">
            <button onclick="showTab('brand')" class="font-bold text-[#c5a059]">Branding</button>
            <button onclick="showTab('dev')" class="text-gray-500 hover:text-white">Developer Manifest</button>
        </div>
        <div id="content-brand" class="tab-content active">
            <h1 class="text-4xl font-bold">${brand.companyName}</h1>
            <p>${brand.tagline}</p>
        </div>
        <div id="content-dev" class="tab-content">
            <pre id="manifest-content" class="bg-black p-4 rounded text-green-400 text-xs overflow-x-auto">${devManifest}</pre>
            <button onclick="copyManifest()" class="mt-4 px-4 py-2 bg-[#c5a059] text-black font-bold rounded">Copy JSON</button>
        </div>
    </div>
    <script>
        function showTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById('content-' + tab).classList.add('active');
        }
    function copyManifest() {
        const manifest = document.getElementById('manifest-content').innerText;
        navigator.clipboard.writeText(manifest);
        alert('Manifest copiado!');
    }
    </script>
</body>
</html>`;
}

// Minimal main
async function main() {
    const [,, websiteUrl, outputDir] = process.argv;
    const outDir = outputDir || path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    // Mock brand for testing structure
    const brand = { companyName: "Test", tagline: "Test", colors: {}, typography: {}, services: [], brandVision: "", brandDescription: "", suggestedHeroScenes: [], meta: {} };
    fs.writeFileSync(path.join(outDir, 'brand-card.html'), generateBrandCard(brand, {}));
    log.success('Brand card saved.');
}

main();,filePath: 'C:\Users\carlo\OneDrive\Escritorio\render creastilo\nano-banana-projects\brand-analyzer.mjs')

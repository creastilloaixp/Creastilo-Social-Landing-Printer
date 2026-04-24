import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import AdmZip from 'adm-zip';
import { printLanding } from './scripts/landing-printer.js';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

import { createClient } from '@supabase/supabase-js';
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

if (!supabase) console.warn("⚠ Supabase no configurado, persistencia desactivada.");

const execPromise = promisify(exec);
const app = express();
const port = process.env.PORT || 4000;
const SURFAGENT_URL = process.env.SURFAGENT_URL || 'http://localhost:3456';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/assets/client';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static('public'));

let jobStatus = { step: 'Idle', progress: 0 };
app.get('/api/status', (req, res) => res.json(jobStatus));

const OUTPUT_DIR = './nano-banana-projects/output';

app.post('/api/analyze', upload.array('assets', 10), async (req, res) => {
    const { url, painPoints, projectVision, analysisType } = req.body;
    const files = req.files || [];
    jobStatus = { step: 'Iniciando misión...', progress: 10 };
    
    try {
        let imageAssets = files.map(f => f.filename);
        let visualData = { colors: [], fonts: [], meta: {}, subpages: [], logo: null, uiTokens: { borderRadius: '1rem' } };
        let screenshotPath = null;
        let tabId = null;

        try {
            const isSocialMedia = analysisType === 'social';
            const waitTime = isSocialMedia ? 6000 : 3000;
            
            jobStatus = { step: 'Conectando con agente...', progress: 20 };
            const surfResponse = await fetch(`${SURFAGENT_URL}/recon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, wait: waitTime }) 
            });
            if (!surfResponse.ok) throw new Error(`Recon failed: ${surfResponse.statusText}`);
            
            const reconData = await surfResponse.json();
            tabId = reconData.tabId;

            jobStatus = { step: 'Optimizando vista...', progress: 30 };
            const scrollScript = isSocialMedia 
                ? "window.scrollBy({ top: 800, behavior: 'smooth' }); setTimeout(() => window.scrollBy({ top: 800, behavior: 'smooth' }), 1000);"
                : "window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });";
            await fetch(`${SURFAGENT_URL}/eval`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tab: tabId, expression: scrollScript })
            });
            await new Promise(resolve => setTimeout(resolve, 3000));

            if (!isSocialMedia) {
                jobStatus = { step: 'Mapeando estructura...', progress: 40 };
                const getLinksResponse = await fetch(`${SURFAGENT_URL}/eval`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        tab: tabId,
                        expression: `(() => {
                            const keywords = ['about', 'services', 'products', 'nosotros', 'servicios'];
                            return Array.from(document.querySelectorAll('a[href]'))
                                .filter(a => (a.href.startsWith(window.location.origin) || a.href.startsWith('/')) && keywords.some(kw => a.href.toLowerCase().includes(kw) || a.innerText.toLowerCase().includes(kw)))
                                .slice(0, 2)
                                .map(a => ({ url: a.href, text: a.innerText }));
                        })();`
                    })
                });
                if (getLinksResponse.ok) {
                    const linksToVisit = await getLinksResponse.json();
                    for (const linkObj of (linksToVisit.result || linksToVisit)) {
                        jobStatus = { step: `Explorando: ${linkObj.text}...`, progress: 50 };
                        await fetch(`${SURFAGENT_URL}/navigate`, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ tab: tabId, url: linkObj.url }) 
                        });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        const subpageEval = await fetch(`${SURFAGENT_URL}/eval`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                tab: tabId,
                                expression: `(() => { return { title: document.title, content: Array.from(document.querySelectorAll('h2, p')).map(el => el.innerText).join('\\n').substring(0, 1000) }; })();`
                            })
                        });
                        if (subpageEval.ok) {
                            const data = await subpageEval.json();
                            visualData.subpages.push({ section: linkObj.text, title: data.result.title, content: data.result.content });
                        }
                    }
                    await fetch(`${SURFAGENT_URL}/navigate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab: tabId, url: url }) });
                }
            }

            jobStatus = { step: 'Extrayendo identidad visual...', progress: 70 };
            const evalResponse = await fetch(`${SURFAGENT_URL}/eval`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tab: tabId,
                    expression: `(() => { 
                        const c = new Set(), f = new Set(); 
                        document.querySelectorAll('h1, h2, h3, p, button, a, section, div, article').forEach(el => { 
                            const s = window.getComputedStyle(el); 
                            if(s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent' && s.backgroundColor !== 'rgb(0, 0, 0)') c.add(s.backgroundColor); 
                            if(s.color && s.color !== 'rgba(0, 0, 0, 0)' && s.color !== 'rgb(0, 0, 0)') c.add(s.color); 
                            if(s.fontFamily && s.fontFamily !== 'none') f.add(s.fontFamily); 
                        }); 
                        const meta = {
                            title: document.title,
                            description: document.querySelector('meta[name="description"]')?.content || '',
                            h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join(' | ').substring(0, 500)
                        };
                        let logo = null;
                        const cand = document.querySelector('img[src*="logo"], [class*="logo"] img, header img');
                        if (cand) logo = { type: 'img', content: cand.src };
                        
                        let borderRadius = '1rem'; 
                        const btn = document.querySelector('button, .btn');
                        if (btn) borderRadius = window.getComputedStyle(btn).borderRadius;
                        
                        const conversionMap = Array.from(document.querySelectorAll('button, a.btn, .cta, [role="button"]'))
                            .filter(el => el.innerText.length > 0 && el.innerText.length < 30)
                            .map(el => {
                                const s = window.getComputedStyle(el);
                                return {
                                    text: el.innerText.trim(),
                                    color: s.backgroundColor,
                                    isPrimary: el.className.toLowerCase().includes('primary') || el.innerText.toLowerCase().includes('compra')
                                };
                            }).slice(0, 3);
                        
                        return { colors: Array.from(c).slice(0, 8), fonts: Array.from(f).slice(0, 4), meta, logo, uiTokens: { borderRadius }, conversionMap }; 
                    })();`
                })
            });
            
            if(evalResponse.ok) {
                const res = await evalResponse.json();
                visualData = { ...visualData, ...(res.result || res) };
            }

            jobStatus = { step: 'Generando evidencia visual...', progress: 80 };
            // Screenshot disabled to avoid process conflict

        } catch (e) {
            console.log("⚠ Error Surfagent:", e.message);
        }

        jobStatus = { step: 'Analizando con IA...', progress: 90 };
        const strategyContext = { 
            painPoints, projectVision, files: imageAssets, visualIdentity: visualData,
            reconScreenshot: screenshotPath,
            isSocial: analysisType === 'social'
        };
        fs.writeFileSync('current_strategy.json', JSON.stringify(strategyContext, null, 2));

        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        await execPromise(`node nano-banana-projects/brand-analyzer.mjs "${url}" "${OUTPUT_DIR}"`);
        
        const cardSource = path.join(OUTPUT_DIR, 'brand-card.html');
        if (fs.existsSync(cardSource)) fs.copyFileSync(cardSource, 'public/brand-card.html');
        
        const brandData = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/brand.json`, 'utf-8'));

        if (supabase) {
            try {
                await supabase.from('brand_analysis').insert([{
                    url: url,
                    strategy: strategyContext,
                    brand_data: brandData,
                    screenshot_url: screenshotPath
                }]);
            } catch (supaErr) { console.error("⚠ Supabase Error:", supaErr.message); }
        }

        jobStatus = { step: 'Listo', progress: 100 };
        res.json({ success: true, brand: brandData, card: 'brand-card.html', visualIdentity: visualData });
    } catch (error) {
        console.error(error);
        jobStatus = { step: 'Error', progress: 0 };
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-visuals', async (req, res) => {
    try {
        await execPromise(`node nano-banana-projects/generate-scene.mjs "${OUTPUT_DIR}/brand.json" 0`);
        const imagePath = `${OUTPUT_DIR}/scene-0.png`;
        await execPromise(`node nano-banana-projects/animate-scene.mjs "${imagePath}" "Slow cinematic zoom, dramatic lighting" 5 "${OUTPUT_DIR}" --wavespeed`);
        const videoPath = `${OUTPUT_DIR}/scene-0-video-1.mp4`;
        await execPromise(`node nano-banana-projects/extract-frames.mjs "${videoPath}" 60 "public/frames"`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/build', async (req, res) => {
    try {
        await execPromise(`node nano-banana-projects/build-landing.mjs`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/export', (req, res) => {
    try {
        const zip = new AdmZip();
        if (fs.existsSync('public/index.html')) zip.addLocalFile('public/index.html');
        if (fs.existsSync('public/frames')) zip.addLocalFolder('public/frames', 'frames');
        if (fs.existsSync('public/assets/client')) zip.addLocalFolder('public/assets/client', 'assets/client');
        if (fs.existsSync('public/brand-card.html')) zip.addLocalFile('public/brand-card.html');

        const zipName = `Creastilo_Landing_${Date.now()}.zip`;
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipName}`);
        res.send(zip.toBuffer());
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, '0.0.0.0', () => console.log(`🚀 NANO BANANA ORCHESTRATOR v4.0 - READY on port ${port}`));

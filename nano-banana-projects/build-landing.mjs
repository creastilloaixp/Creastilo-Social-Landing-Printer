#!/usr/bin/env node
/**
 * build-landing.mjs — Fase Final: Ensamblaje con Gemini 2.5 Pro
 * Genera public/index.html directamente desde brand.json + escenas generadas
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
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.bright}${colors.cyan}→${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

async function buildLanding() {
  const outputDir = path.join(__dirname, 'output');
  const brandPath = path.join(outputDir, 'brand.json');

  if (!fs.existsSync(brandPath)) {
    log.error('brand.json not found. Run brand-analyzer.mjs first.');
    process.exit(1);
  }

  const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));

  // Detectar escenas generadas
  const sceneFiles = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('scene-') && (f.endsWith('.png') || f.endsWith('.jpg')))
    .sort();

  const scenePaths = sceneFiles.map(f => `nano-banana-projects/output/${f}`);
  log.info(`Escenas detectadas: ${sceneFiles.length}`);
  sceneFiles.forEach((f, i) => log.info(`  Escena ${i+1}: ${f}`));

  log.step('Llamando a Gemini 2.5 Pro para ensamblaje maestro...');

  const prompt = `Eres un desarrollador frontend de élite y diseñador UI/UX especializado en landing pages de muy alta conversión y diseño estético "Apple-level" o "Boutique".

Genera una landing page HTML completa, autocontenida y de nivel mundial para la siguiente marca:

## DATOS DE MARCA (Extraídos y Analizados):
${JSON.stringify(brand, null, 2)}

## ESCENAS / RECURSOS VISUALES:
Las siguientes imágenes están disponibles localmente:
${scenePaths.map((p, i) => `- Escena ${i+1}: /${p}`).join('\n')}
Usa estas imágenes en las secciones correspondientes (Hero, Servicios, etc.).

## REGLAS ABSOLUTAS DE DISEÑO Y CÓDIGO:
1. **Diseño a la medida:** Adapta absolutamente todo (secciones, copywriting, estilo de botones) a la industria y necesidades de la marca. NO asumas que es una inmobiliaria a menos que los datos lo digan.
2. **Colores:** Utiliza estrictamente la paleta de colores proporcionada en el JSON (${brand.colors?.primary}, etc.). Si el fondo principal de la marca es oscuro, haz una web oscura (Dark Mode).
3. **Tipografía:** Usa Google Fonts importadas correctamente basadas en el JSON (${brand.typography?.heading} para títulos, ${brand.typography?.body} para textos).
4. **Copywriting:** Usa los textos del JSON para el Hero, Títulos de Servicios, Precios, etc. Amplía el texto de manera profesional y persuasiva donde sea necesario.
5. **Estructura Requerida:**
   - Hero Section (con la imagen Escena 1 de fondo o al lado, titular principal y CTA).
   - Sección de Visión / Problema (usando la descripción de la marca).
   - Sección de Servicios / Ofertas (Renderiza los servicios del JSON).
   - Sección de Precios (Si existen en el JSON).
   - Formulario / Contacto (Usando los datos de contacto del JSON).
6. **Animaciones y Estilo:** Usa un diseño ultra-moderno tipo "Bento Grid" (estilo Apple), con tarjetas redondeadas, glassmorphism avanzado (backdrop-filter), bordes finos sutiles (border-white/10), y animaciones fluidas (Fade-in al hacer scroll, hover scale suave). Asegúrate de que sea 100% Mobile Responsive con una grilla que se adapta elegantemente.
7. **Bibliotecas Externas:** Solo puedes usar Tailwind CSS (vía CDN script), Google Fonts, y FontAwesome/Lucide para íconos. Ninguna otra dependencia externa.

## FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con el código HTML completo. Sin markdown, sin bloques de código, sin comentarios extra. Desde <!DOCTYPE html> hasta </html>.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16384
          }
        })
      }
    );

    const result = await response.json();

    if (result.error) {
      log.error('Error de API: ' + result.error.message);
      process.exit(1);
    }

    const parts = result.candidates?.[0]?.content?.parts || [];
    let html = '';
    for (const part of parts) {
      if (part.text) html += part.text;
    }

    // Limpiar markdown si viene envuelto
    html = html.replace(/^```html\s*/i, '').replace(/\s*```$/, '').trim();

    if (!html.includes('<!DOCTYPE')) {
      log.error('La respuesta no parece HTML válido. Primeros 200 chars: ' + html.substring(0, 200));
      process.exit(1);
    }

    // Guardar el HTML generado
    const outPath = path.join(process.cwd(), 'public', 'index.html');
    fs.writeFileSync(outPath, html, 'utf-8');

    log.success(`Landing page generada: public/index.html (${(html.length / 1024).toFixed(0)}KB)`);
    console.log(`\n${colors.bright}${colors.green}✨ Ensamblaje Completo con Gemini 2.5 Pro!${colors.reset}`);
    console.log(`  Abre: ${colors.cyan}http://localhost:3000/${colors.reset}`);

  } catch (err) {
    log.error('Error de red: ' + err.message);
    process.exit(1);
  }
}

buildLanding();

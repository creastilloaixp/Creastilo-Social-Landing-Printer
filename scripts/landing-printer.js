import fs from 'fs';
import path from 'path';

/**
 * LANDING PRINTER v4.0 - Herramienta de Cierre B2B
 * Ordena el flujo de entrega en 3 niveles de valor.
 */

export async function printLanding(tier = 'basic', brandDataPath = './nano-banana-projects/output/brand.json') {
    if (!fs.existsSync(brandDataPath)) {
        throw new Error("No se encontró el ADN de marca. Ejecuta el análisis primero.");
    }

    const brand = JSON.parse(fs.readFileSync(brandDataPath, 'utf-8'));
    const modulesDir = './nano-banana-projects/cinematic-modules';

    // Configuración de Módulos por Nivel
    const tiers = {
        basic: {
            name: "Express Conversion",
            modules: ['11-smooth-scroll-nav.html', '05-typewriter.html', '08-flip-cards.html'],
            description: "Optimizado para velocidad y ventas directas."
        },
        pro: {
            name: "Premium Interactive",
            modules: ['11-smooth-scroll-nav.html', '10-parallax-hero.html', '04-reveal-text.html', '02-accordion-slider.html'],
            description: "Estética de alto nivel con profundidad 3D y fluidez."
        },
        premium: {
            name: "Cinematic Experience",
            modules: ['11-smooth-scroll-nav.html', '01-scroll-video-player.html', '03-kinetic-text.html', '06-glitch-effect.html', '07-image-trail.html'],
            description: "Inmersión total con video generado por IA y Scroll Cinema."
        }
    };

    const config = tiers[tier] || tiers.basic;
    
    let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.name} | ${brand.tagline}</title>
    
    <!-- SEO & SEGURIDAD -->
    <meta name="description" content="${brand.hero.subheadline}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${brand.name}">
    <meta property="og:description" content="${brand.hero.subheadline}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${brand.typography.heading.replace(/ /g, '+')}&family=${brand.typography.body.replace(/ /g, '+')}:wght@300;400;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: ${brand.colors.primary};
            --secondary: ${brand.colors.secondary};
            --accent: ${brand.colors.accent};
            --background: ${brand.colors.background};
            --text: ${brand.colors.text};
            --font-h: '${brand.typography.heading}', serif;
            --font-b: '${brand.typography.body}', sans-serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: var(--background); 
            color: var(--text); 
            font-family: var(--font-b);
            line-height: 1.6;
            overflow-x: hidden;
        }
        h1, h2, h3 { font-family: var(--font-h); color: var(--primary); }
        .tier-badge {
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: var(--primary); color: var(--background);
            padding: 5px 15px; border-radius: 20px; font-size: 10px; font-weight: 900;
            text-transform: uppercase; letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="tier-badge">${config.name}</div>
    <div id="content-wrapper">
    `;

    // Ensamblaje de Módulos
    for (const mFile of config.modules) {
        const mPath = path.join(modulesDir, mFile);
        if (fs.existsSync(mPath)) {
            let mContent = fs.readFileSync(mPath, 'utf-8');
            
            // Extraer Partes
            const style = mContent.match(/<style>([\s\S]*?)<\/style>/);
            const body = mContent.match(/<body>([\s\S]*?)<\/body>/);
            const script = mContent.match(/<script>([\s\S]*?)<\/script>/);

            if (style) html += `<style>${style[1]}</style>\n`;
            
            if (body) {
                let bodyHtml = body[1];
                // Inyectar Brand DNA
                bodyHtml = bodyHtml.replace(/Denisse Aniram/g, brand.name);
                bodyHtml = bodyHtml.replace(/Tu Sueño, Nuestro Detalle\./g, brand.hero.headline);
                bodyHtml = bodyHtml.replace(/Diseños exclusivos/g, brand.hero.subheadline);
                bodyHtml = bodyHtml.replace(/Agenda tu Cita/g, brand.hero.cta);
                
                // Lógica de Tier 2 (Background 3D/Style)
                if (tier === 'pro' && mFile.includes('10-parallax-hero')) {
                    bodyHtml = bodyHtml.replace(/https:\/\/images\.unsplash\.com\/photo-[\w\d?=]+/g, `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop`); // Abstract 3D
                }

                html += `<div class="module-section">${bodyHtml}</div>\n`;
            }

            if (script) html += `<script>${script[1]}</script>\n`;
        }
    }

    html += `
        <footer style="padding: 80px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <h2 style="font-size: 2rem;">${brand.name}</h2>
            <p style="opacity: 0.6; margin-top: 10px;">${brand.tagline}</p>
            <div style="margin-top: 30px;">
                <a href="#" style="color: var(--primary); text-decoration: none; font-weight: bold;">CONTACTO</a>
            </div>
        </footer>
    </div>
</body>
</html>`;

    fs.writeFileSync('./public/index.html', html);
    return { success: true, tier: config.name };
}

import fs from 'fs';
import path from 'path';
import https from 'https';

const GEMINI_API_KEY = 'AIzaSyDJoQpkF6oYCaoFFSWMBIRa1HmwX1MPFh8';
const OUTPUT_DIR = 'C:\\Users\\carlo\\OneDrive\\Escritorio\\CastoProject\\assets';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PROMPTS = [
  {
    name: 'hero-sanar-deuda',
    prompt: `Generate a professional hero image for a real estate company that helps people with debt problems. A worried family in front of a modest house, looking at documents with concern. Warm amber and orange gradient background representing hope and solution. Modern cinematic style, photorealistic, 16:9 landscape, high quality, soft natural lighting`
  },
  {
    name: 'hero-flipping',
    prompt: `Generate a premium hero image for real estate investment and flipping. Modern luxurious house renovation concept: classic home with renovation materials nearby, blueprint plans, tools. Blue and gold gradient background representing wealth and opportunity. Cinematic style, 16:9 landscape, photorealistic, high quality`
  },
  {
    name: 'notario-legal',
    prompt: `Generate a professional image for a legal real estate service. Elegant office with notarial documents, signing papers, modern architecture. Deep navy blue and white color scheme representing trust and professionalism. Photorealistic, 16:9 landscape, cinematic lighting, high quality`
  },
  {
    name: 'familiafeliz',
    prompt: `Generate a warm, emotional image of a happy family in front of their new home. Moving day scenario with boxes, joyful atmosphere, modern house in background. Golden hour lighting, warm amber and soft white colors. Photorealistic, 16:9 landscape, cinematic, emotional storytelling`
  },
  {
    name: 'propiedad-antes',
    prompt: `Generate a realistic image of an old, distressed property needing renovation. Abandoned house with peeling paint, overgrown garden, broken windows. Realistic style, 16:9 landscape, photorealistic, showing investment opportunity`
  },
  {
    name: 'propiedad-despues',
    prompt: `Generate a beautiful modern renovated house image. Stunning contemporary home with fresh paint, manicured lawn, modern design. Bright, welcoming atmosphere. Photorealistic, 16:9 landscape, cinematic lighting, represents transformation and value`
  },
  {
    name: 'calculadora-deuda',
    prompt: `Generate a modern icon illustration for debt calculation concept. Clean design with calculator, documents, charts on a sleek desk. Minimalist style, blue and white palette, modern flat illustration, 16:9 landscape`
  },
  {
    name: 'ciudades-mexico',
    prompt: `Generate a beautiful aerial view of Mexican cities skyline. Culiacán or Sinaloa cityscape with modern buildings, sunset sky. Warm colors representing Mexican real estate market. Cinematic, 16:9 landscape, photorealistic`
  }
];

function generateImage(prompt, filename) {
  return new Promise((resolve, reject) => {
    console.log(`🎨 Generando: ${filename}...`);
    
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const parts = result.candidates?.[0]?.content?.parts || [];
          
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              const base64Data = part.inlineData.data;
              const buffer = Buffer.from(base64Data, 'base64');
              
              const filepath = path.join(OUTPUT_DIR, filename);
              fs.writeFileSync(filepath, buffer);
              console.log(`   ✅ Guardado: ${filepath} (${(buffer.length / 1024).toFixed(1)}KB)`);
              resolve(true);
              return;
            }
          }
          
          console.log(`   ❌ Error: ${result.error?.message || 'No se encontró imagen'}`);
          resolve(false);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Generando assets para CASTO Landing\n');
  
  for (const item of PROMPTS) {
    await generateImage(item.prompt, `${item.name}.png`);
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('\n✅ ¡Todas las imágenes generadas!');
}

main().catch(console.error);
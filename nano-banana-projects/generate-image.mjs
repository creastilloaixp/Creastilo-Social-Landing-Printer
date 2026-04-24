import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = 'AIzaSyDJoQpkF6oYCaoFFSWMBIRa1HmwX1MPFh8';
const OUTPUT_DIR = 'C:\\Users\\carlo\\OneDrive\\Escritorio\\creastilo-agency\\demos\\seguros\\landing-pro-app\\nano-banana-projects';

const PROMPT = `Generate an image: A premium luxury hero image for an insurance company website. Deep navy blue and gold gradient background. Professional modern style. Elements: elegant shield icon representing protection, a happy family silhouette, modern city architecture skyline. 16:9 landscape aspect ratio, photorealistic, high quality, cinematic lighting, ultra detailed`;

async function generateImage() {
  console.log('🎨 Generando imagen con Gemini 2.5 Flash Image...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: PROMPT }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    }
  );

  const result = await response.json();
  
  // Buscar la imagen en la respuesta
  const parts = result.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const base64Data = part.inlineData.data;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `hero-insurance-${Date.now()}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      fs.writeFileSync(filepath, buffer);
      console.log(`✅ Imagen guardada: ${filepath}`);
      return;
    }
  }
  
  console.log('❌ No se encontró imagen en la respuesta');
  console.log('Respuesta:', JSON.stringify(result, null, 2));
}

generateImage().catch(console.error);
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = 'AIzaSyDJoQpkF6oYCaoFFSWMBIRa1HmwX1MPFh8';

async function listModels() {
  console.log('📋 Obteniendo lista de modelos disponibles...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
  );
  
  const result = await response.json();
  console.log('Modelos disponibles:');
  
  if (result.models) {
    result.models.forEach(m => {
      console.log(`  - ${m.name}`);
    });
  }
}

listModels().catch(console.error);
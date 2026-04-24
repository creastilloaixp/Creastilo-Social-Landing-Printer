import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();
const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url);
        console.log("--- AVAILABLE MODELS ---");
        response.data.models.forEach(m => {
            console.log(`- ${m.name} [Methods: ${m.supportedGenerationMethods.join(', ')}]`);
        });
    } catch (error) {
        console.error("Failed to list models:", error.response?.data || error.message);
    }
}

listModels();

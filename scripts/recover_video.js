import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const OPERATION_ID = "models/veo-3.1-generate-preview/operations/jc9s9h8tg3vq";

async function recover() {
    console.log(`[RECOVERY] Attempting to pull data from operation: ${OPERATION_ID}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/${OPERATION_ID}?key=${API_KEY}`;
    
    try {
        const response = await axios.get(url);
        const status = response.data;

        if (status.done && status.response) {
            console.log("[DEBUG] Response Found. Extracting URI...");
            
            const gvr = status.response.generateVideoResponse;
            const videoUri = gvr?.generatedSamples?.[0]?.video?.uri;

            if (videoUri) {
                console.log(`[DOWNLOADING] Fetching video from: ${videoUri}`);
                const fullUri = videoUri.includes('?') ? `${videoUri}&key=${API_KEY}` : `${videoUri}?key=${API_KEY}`;
                
                const vidResponse = await axios.get(fullUri, { responseType: 'arraybuffer' });
                const outputPath = path.resolve(process.cwd(), 'public', 'agency_cinematic.mp4');
                fs.writeFileSync(outputPath, vidResponse.data);
                
                console.log(`[MISSION_COMPLETE] Video recovered successfully! Path: ${outputPath}`);
            } else {
                console.log("[ERROR] Operation is done but no video data found in response structure.");
                console.log(JSON.stringify(status.response, null, 2));
            }
        } else {
            console.log("[INFO] Operation not found or not finished yet.");
        }
    } catch (e) {
        console.error("[FAIL]", e.message);
    }
}

recover();
